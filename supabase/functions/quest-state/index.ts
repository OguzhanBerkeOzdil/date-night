import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const ALLOWED_ORIGINS = new Set([
  "https://oguzhanberkeozdil.github.io",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

const SAFE_KEYS = new Set([
  "schemaVersion", "chapter", "chapterOneComplete", "chapterTwoStarted",
  "chapterTwoComplete", "chapterTwoOpenedEarly", "consentShared", "scheduledDate",
  "timeZone", "steedName", "steedClass", "affection", "fed", "rating",
  "ratingBonus", "ratingChip", "todayVibe", "secondDate", "food", "activities",
  "potionBase", "potionName", "vibe", "notes", "day", "time", "fanumTax",
  "tarotCard", "tarotKey", "achievements", "honestNo", "partyBuff",
  "favoriteMoment", "questBadge", "futureQuest", "lastScreen", "stats",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://oguzhanberkeozdil.github.io",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "content-type": "application/json; charset=utf-8",
    "vary": "Origin",
  };
}

function json(req: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: corsHeaders(req) });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeState(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SAFE_KEYS.has(key)) output[key] = value;
  }
  if (JSON.stringify(output).length > 24_000) return null;
  output.schemaVersion = 3;
  return output;
}

function inviteStatus(state: Record<string, unknown>) {
  if (state.chapterTwoComplete) return "complete";
  if (state.honestNo || state.secondDate === "no") return "declined";
  if (state.secondDate === "maybe") return "maybe";
  if (state.secondDate === "yes") return "accepted";
  return "active";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== "POST") return json(req, { error: "Method not allowed" }, 405);
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(req, { error: "Origin not allowed" }, 403);
  if (Number(req.headers.get("content-length") || 0) > 32_000) {
    return json(req, { error: "Request too large" }, 413);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { error: "Use a valid JSON request" }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) {
    return json(req, { error: "Invitation unavailable" }, 404);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(req, { error: "Server configuration unavailable" }, 503);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const tokenHash = await sha256(token);
  const { data: invite, error: inviteError } = await admin
    .from("quest_invites")
    .select("id, guest_display_name, scheduled_date, timezone, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (inviteError) return json(req, { error: "Unable to read invitation" }, 503);
  if (!invite || invite.status === "revoked") {
    return json(req, { error: "Invitation unavailable" }, 404);
  }
  if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
    return json(req, { error: "Invitation unavailable" }, 410);
  }

  if (body.action === "load") {
    const { data: progress, error } = await admin
      .from("quest_progress")
      .select("state, revision, updated_at")
      .eq("invite_id", invite.id)
      .maybeSingle();
    if (error) return json(req, { error: "Unable to load quest" }, 503);
    return json(req, {
      guestName: invite.guest_display_name,
      scheduledDate: invite.scheduled_date,
      timeZone: invite.timezone,
      state: progress?.state || null,
      revision: progress?.revision || 0,
      updatedAt: progress?.updated_at || null,
    });
  }

  if (body.action !== "save") return json(req, { error: "Unknown action" }, 400);
  const state = sanitizeState(body.state);
  if (!state || state.consentShared !== true) {
    return json(req, { error: "Consent is required before saving" }, 400);
  }
  const expectedRevision = Number(body.revision) || 0;
  const now = new Date().toISOString();
  const { data: current, error: readError } = await admin
    .from("quest_progress")
    .select("revision, chapter_one_completed_at, chapter_two_started_at, completed_at")
    .eq("invite_id", invite.id)
    .maybeSingle();
  if (readError) return json(req, { error: "Unable to save quest" }, 503);
  if ((current?.revision || 0) !== expectedRevision) {
    return json(req, {
      error: "Quest changed on another device",
      revision: current?.revision || 0,
    }, 409);
  }

  const nextRevision = expectedRevision + 1;
  const timestamps = {
    chapter_one_completed_at: state.chapterOneComplete
      ? current?.chapter_one_completed_at || now
      : null,
    chapter_two_started_at: state.chapterTwoStarted
      ? current?.chapter_two_started_at || now
      : null,
    completed_at: state.chapterTwoComplete ? current?.completed_at || now : null,
  };
  let saveFailed = false;
  if (current) {
    const result = await admin
      .from("quest_progress")
      .update({ state, revision: nextRevision, updated_at: now, ...timestamps })
      .eq("invite_id", invite.id)
      .eq("revision", expectedRevision)
      .select("revision")
      .maybeSingle();
    saveFailed = Boolean(result.error || !result.data);
  } else {
    const result = await admin.from("quest_progress").insert({
      invite_id: invite.id,
      schema_version: 3,
      state,
      revision: nextRevision,
      ...timestamps,
    });
    saveFailed = Boolean(result.error);
  }
  if (saveFailed) return json(req, { error: "Unable to save quest" }, 409);

  await admin
    .from("quest_invites")
    .update({ status: inviteStatus(state), updated_at: now })
    .eq("id", invite.id);
  return json(req, { ok: true, revision: nextRevision, updatedAt: now });
});

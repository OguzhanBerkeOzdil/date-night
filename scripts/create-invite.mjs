import { createHash, randomBytes } from "node:crypto";

function option(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const guestName = option("name");
const scheduledDate = option("date", "2026-10-28");
const timezone = option("timezone", "Europe/Warsaw");
const baseUrl = option("base-url", "https://oguzhanberkeozdil.github.io/date-night/");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the current shell.");
}
if (!guestName) throw new Error("Pass a guest name with --name.");
if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) throw new Error("Use --date YYYY-MM-DD.");

const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const response = await fetch(`${supabaseUrl}/rest/v1/quest_invites`, {
  method: "POST",
  headers: {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "return=representation",
  },
  body: JSON.stringify({
    token_hash: tokenHash,
    guest_display_name: guestName,
    scheduled_date: scheduledDate,
    timezone,
  }),
});
if (!response.ok) throw new Error(`Unable to create invite (${response.status}): ${await response.text()}`);

const inviteUrl = new URL(baseUrl);
inviteUrl.searchParams.set("name", guestName);
inviteUrl.searchParams.set("invite", token);
console.log(`Private invite created for ${guestName} on ${scheduledDate}.`);
console.log(inviteUrl.toString());

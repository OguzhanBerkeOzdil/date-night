create extension if not exists pgcrypto with schema extensions;

create table public.quest_invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  guest_display_name text not null check (char_length(guest_display_name) between 1 and 80),
  scheduled_date date not null,
  timezone text not null default 'Europe/Warsaw',
  status text not null default 'active' check (status in ('active', 'accepted', 'maybe', 'declined', 'complete', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_progress (
  invite_id uuid primary key references public.quest_invites(id) on delete cascade,
  schema_version smallint not null default 3 check (schema_version = 3),
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  chapter_one_completed_at timestamptz,
  chapter_two_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quest_invites_status_idx on public.quest_invites(status);
create index quest_progress_updated_at_idx on public.quest_progress(updated_at desc);

alter table public.quest_invites enable row level security;
alter table public.quest_progress enable row level security;

revoke all on table public.quest_invites from anon, authenticated;
revoke all on table public.quest_progress from anon, authenticated;
grant all on table public.quest_invites to service_role;
grant all on table public.quest_progress to service_role;

comment on table public.quest_invites is 'Private token-gated invitations. Raw invite tokens are never stored.';
comment on table public.quest_progress is 'Versioned two-chapter quest state, accessible only through the Edge Function.';

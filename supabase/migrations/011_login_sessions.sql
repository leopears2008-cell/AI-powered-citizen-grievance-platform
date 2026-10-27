-- NivaranAI: login session history (who signed in, when, from where).
--
-- ADDITIVE ONLY: creates one new table, its indexes and one trigger function.
-- It does not alter or read any existing table, policy, or trigger.
-- Safe to re-run. NOT applied automatically: run it in the Supabase SQL editor
-- or with the Supabase CLI when you are ready.
--
-- Nothing writes to this table yet. A server-side hook in the login flow must
-- insert a row after Firebase Auth verification (service_role key only).
--
-- Privacy: ip_address and user_agent are personal data. Decide a retention
-- period (for example 90 days) and purge older rows with a scheduled job:
--   delete from public.login_sessions where logged_in_at < now() - interval '90 days';

create table if not exists public.login_sessions (
  id bigint generated always as identity primary key,
  user_id text not null check (char_length(user_id) between 1 and 128),  -- Firebase UID
  logged_in_at timestamptz not null default now(),
  ip_address text check (ip_address is null or char_length(ip_address) <= 64),
  user_agent text check (user_agent is null or char_length(user_agent) <= 512)
);

create index if not exists idx_login_sessions_user_time
  on public.login_sessions (user_id, logged_in_at desc);
create index if not exists idx_login_sessions_time
  on public.login_sessions (logged_in_at desc);

-- Access model: RLS on, no policies, no client privileges. Only the server
-- (service_role) can read or write.
alter table public.login_sessions enable row level security;
revoke all on table public.login_sessions from public, anon, authenticated;

-- Rows are append-only: updates are rejected. Deletes stay possible so a
-- retention job can purge old rows.
create or replace function public.login_sessions_block_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'login_sessions rows are immutable.' using errcode = '42501';
end;
$$;

drop trigger if exists trg_login_sessions_block_update on public.login_sessions;
create trigger trg_login_sessions_block_update
  before update on public.login_sessions
  for each row execute function public.login_sessions_block_update();

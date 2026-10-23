-- Civic proof, citizen verification, SLA, and incident clustering foundation.
-- Apply after 007_admin_analytics.sql. Private evidence/OTP records are backend-only.

alter table public.grievances
  add column if not exists citizen_verified boolean not null default false,
  add column if not exists reopen_count integer not null default 0 check (reopen_count >= 0),
  add column if not exists master_incident_id uuid,
  add column if not exists impact_upvotes integer not null default 0 check (impact_upvotes >= 0),
  add column if not exists sla_level smallint not null default 1 check (sla_level between 1 and 3),
  add column if not exists sla_due_at timestamptz,
  add column if not exists last_escalated_at timestamptz;

create table if not exists public.grievance_evidence (
  id uuid primary key default gen_random_uuid(),
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  uploaded_by text not null,
  evidence_kind text not null check (evidence_kind in ('before','after')),
  storage_path text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  captured_at timestamptz,
  uploaded_at timestamptz not null default now(),
  metadata_verified boolean not null default false,
  check (length(storage_path) between 1 and 1024)
);
create index if not exists idx_grievance_evidence_grievance_kind
  on public.grievance_evidence(grievance_id, evidence_kind, uploaded_at desc);

create table if not exists public.civic_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  normalized_summary text not null,
  category text not null,
  district text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  status text not null default 'open' check (status in ('open','monitoring','resolved','merged')),
  impact_count integer not null default 1 check (impact_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.grievances
  drop constraint if exists grievances_master_incident_id_fkey;
alter table public.grievances
  add constraint grievances_master_incident_id_fkey
  foreign key (master_incident_id) references public.civic_incidents(id)
  on delete set null;
create index if not exists idx_civic_incidents_category_status
  on public.civic_incidents(category, status, updated_at desc);
create index if not exists idx_civic_incidents_geo
  on public.civic_incidents(latitude, longitude);

create table if not exists public.civic_incident_votes (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.civic_incidents(id) on delete cascade,
  citizen_id text not null,
  created_at timestamptz not null default now(),
  unique (incident_id, citizen_id)
);

create table if not exists public.grievance_resolution_challenges (
  id uuid primary key default gen_random_uuid(),
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  citizen_id text not null,
  otp_hash text,
  verification_token_hash text,
  expires_at timestamptz not null,
  feedback_rating smallint check (feedback_rating between 1 and 5),
  feedback_comment text,
  resolved_confirmed boolean,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_resolution_challenges_pending
  on public.grievance_resolution_challenges(grievance_id, expires_at desc)
  where consumed_at is null;

-- All writes to these records must go through the trusted server using the
-- Supabase service role. Never expose service-role credentials to the browser.
alter table public.grievance_evidence enable row level security;
alter table public.civic_incidents enable row level security;
alter table public.civic_incident_votes enable row level security;
alter table public.grievance_resolution_challenges enable row level security;

revoke all on public.grievance_evidence from anon, authenticated;
revoke all on public.civic_incidents from anon, authenticated;
revoke all on public.civic_incident_votes from anon, authenticated;
revoke all on public.grievance_resolution_challenges from anon, authenticated;

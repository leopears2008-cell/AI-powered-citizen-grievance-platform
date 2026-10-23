-- Civic emergency mode, public tracking receipt and SLA health support.
-- Apply after migrations 001, 003 and 008. Additive and safe to re-run.
alter table public.site_settings
 add column if not exists emergency_mode boolean not null default false,
 add column if not exists emergency_title text not null default 'Emergency Civic Response Mode',
 add column if not exists emergency_message text not null default '',
 add column if not exists emergency_sla_minutes integer not null default 120 check (emergency_sla_minutes between 15 and 1440),
 add column if not exists updated_by text;

create table if not exists public.district_sla_snapshots (
 district_name text primary key,
 on_time_percent numeric(5,2) not null default 0 check (on_time_percent between 0 and 100),
 total_petitions integer not null default 0 check (total_petitions >= 0),
 critical_open integer not null default 0 check (critical_open >= 0),
 collector_name text,
 collector_source_url text,
 minister_name text,
 minister_source_url text,
 verified_at timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.district_sla_snapshots enable row level security;
revoke all on table public.district_sla_snapshots from anon, authenticated;
grant all on table public.district_sla_snapshots to service_role;

create table if not exists public.grievance_status_events (
 id uuid primary key default gen_random_uuid(),
 grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
 status text not null check (status in ('Submitted','Officer Assigned','Field Inspection','Resolved','Reopened','Escalated')),
 message text not null default '',
 channel text not null default 'in_app' check (channel in ('in_app','sms','whatsapp','system')),
 provider_message_id text,
 delivered_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists idx_grievance_status_events_timeline on public.grievance_status_events(grievance_id, created_at);
alter table public.grievance_status_events enable row level security;
revoke all on table public.grievance_status_events from anon, authenticated;
grant all on table public.grievance_status_events to service_role;

-- Anonymous tracking must use a narrowly scoped server endpoint returning only
-- reference, current status, department and timestamps; never grant table access.

-- NivaranAI grievance operations enhancements.
-- Adds configurable SLA metadata, explicit appeals, persistent in-app notifications,
-- document evidence support, grievance titles, and opaque resolution verification tokens.

alter table public.grievances
  add column if not exists title text not null default 'Citizen Grievance',
  add column if not exists resolution_verification_token text;

create unique index if not exists idx_grievances_resolution_verification_token
  on public.grievances (resolution_verification_token)
  where resolution_verification_token is not null;

-- Notifications are created server-side and are visible only to their owning citizen.
create table if not exists public.grievance_notifications (
  id text primary key,
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  citizen_id text not null,
  type text not null check (type in (
    'status_update', 'assignment', 'resolution', 'sla_warning', 'sla_breached', 'appeal', 'info'
  )),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_grievance_notifications_citizen
  on public.grievance_notifications(citizen_id, created_at desc);
create index if not exists idx_grievance_notifications_grievance
  on public.grievance_notifications(grievance_id, created_at desc);

-- Explicit citizen appeal/reopen records.
create table if not exists public.grievance_appeals (
  id text primary key,
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  citizen_id text not null,
  reason text not null check (char_length(reason) between 1 and 2000),
  status text not null default 'Submitted' check (status in ('Submitted', 'Under Review', 'Accepted', 'Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_grievance_appeals_citizen
  on public.grievance_appeals(citizen_id, created_at desc);
create index if not exists idx_grievance_appeals_grievance
  on public.grievance_appeals(grievance_id, created_at desc);

drop trigger if exists trg_grievance_appeals_updated_at on public.grievance_appeals;
create trigger trg_grievance_appeals_updated_at before update on public.grievance_appeals
  for each row execute function public.set_updated_at();

alter table public.grievance_notifications enable row level security;
alter table public.grievance_appeals enable row level security;

revoke all on table public.grievance_notifications, public.grievance_appeals from anon, authenticated;
grant select, update on public.grievance_notifications to authenticated;
grant select, insert on public.grievance_appeals to authenticated;

drop policy if exists grievance_notifications_select_own on public.grievance_notifications;
create policy grievance_notifications_select_own on public.grievance_notifications
  for select to authenticated
  using (citizen_id = (select public.requesting_uid()));

drop policy if exists grievance_notifications_update_own on public.grievance_notifications;
create policy grievance_notifications_update_own on public.grievance_notifications
  for update to authenticated
  using (citizen_id = (select public.requesting_uid()))
  with check (citizen_id = (select public.requesting_uid()));

drop policy if exists grievance_appeals_select_own on public.grievance_appeals;
create policy grievance_appeals_select_own on public.grievance_appeals
  for select to authenticated
  using (citizen_id = (select public.requesting_uid()) or (select public.is_admin()));

drop policy if exists grievance_appeals_insert_own on public.grievance_appeals;
create policy grievance_appeals_insert_own on public.grievance_appeals
  for insert to authenticated
  with check (
    citizen_id = (select public.requesting_uid())
    and exists (
      select 1 from public.grievances g
      where g.id = grievance_id
        and g.citizen_id = (select public.requesting_uid())
        and g.status = 'Resolved'
    )
  );

-- Existing attachment validation is expanded from image-only to image/PDF documents.
alter table public.grievance_attachments
  drop constraint if exists grievance_attachments_type_check;
alter table public.grievance_attachments
  add constraint grievance_attachments_type_check
  check (type in ('image', 'audio', 'document'));

drop policy if exists attachments_insert_citizen on public.grievance_attachments;
create policy attachments_insert_citizen on public.grievance_attachments
  for insert to authenticated
  with check (
    type in ('image', 'document')
    and (
      url ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$'
      or url ~ '^data:application/pdf;base64,[A-Za-z0-9+/]*={0,2}$'
    )
    and exists (
      select 1 from public.grievances g
      where g.id = grievance_id and g.citizen_id = (select public.requesting_uid())
    )
    and not exists (
      select 1 from public.grievance_attachments a
      where a.grievance_id = grievance_attachments.grievance_id
    )
  );

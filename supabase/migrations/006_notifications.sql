-- NivaranAI: persistent citizen notifications.
-- Application writes use the server-side Supabase service role; direct client access is denied by RLS.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  grievance_id text not null references public.grievances(id) on update cascade on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  title_ta text not null default '' check (char_length(title_ta) <= 160),
  message text not null check (char_length(message) between 1 and 1000),
  message_ta text not null default '' check (char_length(message_ta) <= 1000),
  type text not null check (type in ('status_update','assignment','resolution','info_requested')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_grievance
  on public.notifications(grievance_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, update on public.notifications to authenticated;

create or replace function public.requesting_uid()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.uid()::text, '');
$$;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications
for select to authenticated
using (user_id = public.requesting_uid());

drop policy if exists notifications_mark_own on public.notifications;
create policy notifications_mark_own
on public.notifications
for update to authenticated
using (user_id = public.requesting_uid())
with check (user_id = public.requesting_uid());

-- NivaranAI: server-side analytics aggregation.
-- The API authorizes administrators before invoking this function.

create or replace function public.get_admin_grievance_analytics()
returns jsonb
language sql
stable
set search_path = public
as $$
with base as (
  select
    status,
    priority,
    category,
    location_district,
    created_at,
    resolved_at,
    target_resolution_date,
    feedback_rating
  from public.grievances
),
timeline as (
  select
    to_char(day::date, 'YYYY-MM-DD') as day,
    coalesce((select count(*) from base where created_at >= day and created_at < day + interval '1 day'), 0)::int as submitted,
    coalesce((select count(*) from base where resolved_at >= day and resolved_at < day + interval '1 day'), 0)::int as resolved
  from generate_series(
    date_trunc('month', now()) - interval '5 months',
    date_trunc('month', now()),
    interval '1 month'
  ) as day
),
summary as (
  select
    count(*)::int as total,
    count(*) filter (where status <> 'Resolved' and status <> 'Rejected')::int as pending,
    count(*) filter (where status = 'Resolved')::int as resolved,
    count(*) filter (where status in ('Under Review','Assigned','In Progress'))::int as in_progress,
    count(*) filter (where priority = 'Critical' and status <> 'Resolved' and status <> 'Rejected')::int as critical,
    count(*) filter (where priority = 'High' and status <> 'Resolved' and status <> 'Rejected')::int as high,
    count(*) filter (
      where status <> 'Resolved'
        and status <> 'Rejected'
        and target_resolution_date is not null
        and target_resolution_date < now()
    )::int as sla_breached,
    round(
      coalesce(
        avg(extract(epoch from (resolved_at - created_at)) / 3600)
          filter (where resolved_at is not null),
        0
      )::numeric,
      1
    ) as average_resolution_hours,
    round(coalesce(avg(feedback_rating) filter (where feedback_rating is not null), 0)::numeric, 2) as citizen_satisfaction_score,
    round(coalesce(avg(feedback_rating), 0)::numeric, 1) as citizen_satisfaction_score
  from base
),
categories as (
  select coalesce(jsonb_agg(jsonb_build_object('name', category, 'value', value) order by value desc), '[]'::jsonb) as value
  from (
    select category, count(*)::int as value
    from base
    group by category
  ) grouped
),
priorities as (
  select coalesce(jsonb_object_agg(priority, value), '{}'::jsonb) as value
  from (
    select priority, count(*)::int as value
    from base
    group by priority
  ) grouped
),
timeline as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', to_char(day_start, 'Dy'),
    'submitted', submitted,
    'resolved', resolved
  ) order by day_start), '[]'::jsonb) as value
  from (
    select d.day_start,
      (select count(*) from public.grievances g where g.created_at >= d.day_start and g.created_at < d.day_start + interval '1 day')::int as submitted,
      (select count(*) from public.grievances g where g.resolved_at >= d.day_start and g.resolved_at < d.day_start + interval '1 day')::int as resolved
    from generate_series(current_date - interval '6 days', current_date, interval '1 day') as d(day_start)
  ) daily
),
districts as (
  select coalesce(jsonb_agg(jsonb_build_object('name', location_district, 'value', value) order by value desc), '[]'::jsonb) as value
  from (
    select coalesce(nullif(trim(location_district), ''), 'Unknown') as location_district, count(*)::int as value
    from base
    group by coalesce(nullif(trim(location_district), ''), 'Unknown')
  ) grouped
)
select jsonb_build_object(
  'generatedAt', now(),
  'summary', to_jsonb(summary),
  'categories', categories.value,
  'priorities', priorities.value,
  'districts', districts.value,
  'timelineData', timeline.value
)
from summary, categories, priorities, districts, timeline;
$$;

revoke all on function public.get_admin_grievance_analytics() from public, anon, authenticated;
grant execute on function public.get_admin_grievance_analytics() to service_role;

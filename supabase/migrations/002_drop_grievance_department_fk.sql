-- Grievances store the department as an AI-assigned ID (for example dept-water) plus a
-- denormalised department_name. Those IDs are configuration values and the departments
-- table may not be provisioned, so a foreign key would reject valid grievances.
-- Officers still reference departments, and grievances still reference officers.
alter table public.grievances
  drop constraint if exists grievances_department_id_fkey;

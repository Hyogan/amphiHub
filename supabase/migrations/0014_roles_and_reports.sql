-- Grants the app needs for reading its own roles and filing reports. Idempotent.
grant select on public.user_roles to authenticated;
grant select, insert on public.reports to authenticated;

-- One open report per user, document and reason. A repeat is answered with "already reported".
create unique index if not exists reports_one_open_per_user
  on public.reports (resource_id, reporter_id, reason)
  where status = 'open';
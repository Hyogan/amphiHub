-- 0010: explicit privileges for the app's database roles.
-- New Supabase projects no longer expose tables created by SQL to the app automatically, so every table and
-- function the app uses must be granted here. Row Level Security (0005) still decides WHICH rows each role can touch:
-- a grant only lets the role reach the table at all. If a screen fails with "permission denied for table X",
-- the table is missing from this file.

grant usage on schema public to anon, authenticated;

-- Catalogue: everyone reads. Writes pass only for admins, because the policies require it.
grant select on public.universities, public.academic_units, public.programs, public.courses,
  public.program_courses, public.course_aliases, public.resource_types to anon, authenticated;
grant insert, update, delete on public.universities, public.academic_units, public.programs, public.courses,
  public.program_courses, public.course_aliases, public.resource_types to authenticated;

-- Accounts
grant select on public.profiles, public.user_roles to authenticated;
-- profiles: column-level update was granted in 0005

-- Resources (the readable columns were granted in 0009)
grant insert on public.resources to authenticated;
grant select on public.resource_files to authenticated;
grant insert on public.resource_files to authenticated;
grant select on public.resource_relations to anon, authenticated;
grant insert, update, delete on public.resource_relations to authenticated;

-- Personal library and feedback
grant select, insert, delete on public.saved_resources to authenticated;
grant select, insert, update on public.reports to authenticated;
grant select, insert, update on public.catalog_suggestions to authenticated;
grant select, insert on public.resource_requests to authenticated;
grant select on public.audit_log to authenticated;
grant insert on public.analytics_events to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;

-- Functions the app calls directly, and the helpers the access rules call while a query runs.
grant execute on function public.is_moderator() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_own_submission(uuid) to anon, authenticated;
grant execute on function public.f_unaccent(text) to anon, authenticated;
grant execute on function public.search_resources(text, uuid, uuid, text, integer, text, text, boolean, integer, integer) to anon, authenticated;
grant execute on function public.search_courses(text, uuid, integer) to anon, authenticated;
grant execute on function public.moderate_resource(uuid, text, text) to authenticated;
grant execute on function public.set_resource_verification(uuid, boolean, public.source_status, boolean, text) to authenticated;
grant execute on function public.finalize_resource_file(uuid, text, integer) to authenticated;
-- my_submissions and moderation_queue were granted in 0009.

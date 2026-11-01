-- Access rules. Row Level Security is the real authority: the app only hides what a role should not see.

alter table public.universities enable row level security;
alter table public.academic_units enable row level security;
alter table public.programs enable row level security;
alter table public.courses enable row level security;
alter table public.program_courses enable row level security;
alter table public.course_aliases enable row level security;
alter table public.resource_types enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.resources enable row level security;
alter table public.resource_files enable row level security;
alter table public.resource_relations enable row level security;
alter table public.saved_resources enable row level security;
alter table public.reports enable row level security;
alter table public.catalog_suggestions enable row level security;
alter table public.resource_requests enable row level security;
alter table public.audit_log enable row level security;
alter table public.analytics_events enable row level security;

-- Defence in depth: guests get read access to the catalogue and nothing else.
revoke all on all tables in schema public from anon;
grant select on public.universities, public.academic_units, public.programs, public.courses,
  public.program_courses, public.course_aliases, public.resource_types, public.resources,
  public.resource_relations to anon;
-- Guests may see file size and page count, but never the storage path or hash.
grant select (id, resource_id, mime_type, size_bytes, page_count, processing_status, is_current, created_at)
  on public.resource_files to anon;
grant insert on public.analytics_events to anon;
grant usage on all sequences in schema public to anon;

-- ── Catalogue: everyone reads active rows, only admins write ──────────────────
create policy universities_read on public.universities for select to anon, authenticated
  using (status = 'active' or public.is_admin());
create policy universities_admin on public.universities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy academic_units_read on public.academic_units for select to anon, authenticated
  using (status = 'active' or public.is_admin());
create policy academic_units_admin on public.academic_units for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy programs_read on public.programs for select to anon, authenticated
  using (status = 'active' or public.is_admin());
create policy programs_admin on public.programs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy courses_read on public.courses for select to anon, authenticated
  using (status = 'active' or public.is_admin());
create policy courses_admin on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy program_courses_read on public.program_courses for select to anon, authenticated using (true);
create policy program_courses_admin on public.program_courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy course_aliases_read on public.course_aliases for select to anon, authenticated using (true);
create policy course_aliases_admin on public.course_aliases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy resource_types_read on public.resource_types for select to anon, authenticated
  using (active or public.is_admin());
create policy resource_types_admin on public.resource_types for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── Profiles and roles ────────────────────────────────────────────────────────
create policy profiles_read_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Only these columns can change from the app.
revoke update on public.profiles from authenticated;
grant update (display_name, preferred_language, university_id, program_id, level, semester)
  on public.profiles to authenticated;

create policy user_roles_read_own on public.user_roles for select to authenticated using (user_id = auth.uid());
-- No write policies: roles change only through the service role or an admin using SQL.

-- ── Resources ────────────────────────────────────────────────────────────────
-- Guests and students see published resources. A contributor also sees their own. Moderators see all.
create policy resources_read on public.resources for select to anon, authenticated
  using (status = 'published' or uploader_id = auth.uid() or public.is_moderator());

-- A contributor can only create a plain submission. Status and verification change through functions.
create policy resources_insert_own on public.resources for insert to authenticated
  with check (
    uploader_id = auth.uid()
    and status = 'submitted'
    and source_status = 'unverified'
    and not metadata_reviewed and not correction_reviewed and not ai_assisted
    and duplicate_of is null and published_at is null and moderation_note is null
  );
-- No update or delete policies for the app: published content is changed through reviewed submissions.

-- Files are visible whenever their resource is visible.
create policy resource_files_read on public.resource_files for select to anon, authenticated
  using (exists (select 1 from public.resources r where r.id = resource_files.resource_id));
create policy resource_files_insert_own on public.resource_files for insert to authenticated
  with check (
    exists (
      select 1 from public.resources r
      where r.id = resource_files.resource_id and r.uploader_id = auth.uid() and r.status = 'submitted'
    )
    and processing_status = 'pending' and sha256 is null and is_current
    and storage_path like 'incoming/' || auth.uid()::text || '/%'
  );

create policy resource_relations_read on public.resource_relations for select to anon, authenticated
  using (exists (select 1 from public.resources r where r.id = resource_relations.resource_id));
create policy resource_relations_moderator on public.resource_relations for all to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- ── Personal library ─────────────────────────────────────────────────────────
create policy saved_read_own on public.saved_resources for select to authenticated using (user_id = auth.uid());
create policy saved_insert_own on public.saved_resources for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.resources r where r.id = saved_resources.resource_id)
  );
create policy saved_delete_own on public.saved_resources for delete to authenticated using (user_id = auth.uid());

-- ── Reports, suggestions, requests ───────────────────────────────────────────
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open' and resolution is null);
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_moderator());
create policy reports_moderate on public.reports for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy suggestions_insert on public.catalog_suggestions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy suggestions_read on public.catalog_suggestions for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy suggestions_moderate on public.catalog_suggestions for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy requests_insert on public.resource_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy requests_read on public.resource_requests for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());

-- ── Audit and analytics ──────────────────────────────────────────────────────
create policy audit_read on public.audit_log for select to authenticated using (public.is_moderator());
-- No insert policy: only the security-definer functions write the audit log.

-- Anyone may record an event, nobody may read events from the app.
create policy analytics_insert on public.analytics_events for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- The signed-in user's own submissions with course and university names, status and the moderator's reason.
-- Runs with owner rights and returns only rows where uploader_id is the caller.
create or replace view public.my_contributions
with (security_barrier = true) as
select
  r.id,
  r.title,
  r.status,
  r.type_code,
  r.academic_year,
  r.year_unknown,
  r.exam_session,
  r.course_id,
  c.name as course_name,
  c.code as course_code,
  r.university_id,
  u.name as university_name,
  r.moderation_note,
  r.created_at,
  r.published_at,
  f.size_bytes,
  f.page_count
from public.resources r
join public.courses c on c.id = r.course_id
join public.universities u on u.id = r.university_id
left join public.resource_files f on f.resource_id = r.id and f.is_current
where r.uploader_id = auth.uid();

revoke all on public.my_contributions from public, anon;
grant select on public.my_contributions to authenticated;
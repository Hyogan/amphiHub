-- The review queue: every submission with its course, university, file and the document it may duplicate.
-- Rows appear only for moderators. Uploader identity is left out on purpose: moderators judge the document.
create or replace view public.moderation_items
with (security_barrier = true) as
select
  r.id,
  r.title,
  r.status,
  r.type_code,
  r.academic_year,
  r.year_unknown,
  r.exam_session,
  r.language,
  r.source_type,
  r.source_note,
  r.source_status,
  r.metadata_reviewed,
  r.correction_reviewed,
  r.rights_declared,
  r.moderation_note,
  r.duplicate_of,
  d.title as duplicate_title,
  d.status as duplicate_status,
  r.course_id,
  c.name as course_name,
  c.code as course_code,
  r.university_id,
  u.name as university_name,
  r.created_at,
  f.id as file_id,
  f.size_bytes,
  f.page_count,
  f.processing_status as file_status
from public.resources r
join public.courses c on c.id = r.course_id
join public.universities u on u.id = r.university_id
left join public.resources d on d.id = r.duplicate_of
left join public.resource_files f on f.resource_id = r.id and f.is_current
where public.is_moderator();

revoke all on public.moderation_items from public, anon;
grant select on public.moderation_items to authenticated;

-- The current file of any resource, whatever its status. Moderators only.
create or replace function public.moderator_file_for_review(p_resource uuid)
returns table (file_id uuid, storage_path text, size_bytes bigint, page_count integer)
language sql stable security definer set search_path = public as $$
  select f.id, f.storage_path, f.size_bytes, f.page_count
  from public.resource_files f
  where f.resource_id = p_resource and f.is_current and public.is_moderator();
$$;
revoke all on function public.moderator_file_for_review(uuid) from public, anon;
grant execute on function public.moderator_file_for_review(uuid) to authenticated;
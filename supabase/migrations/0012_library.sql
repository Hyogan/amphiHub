-- The signed-in user's saved documents, in the same shape as recent_resources and course_resources.
-- The view runs with its owner's rights (so the hidden columns on resources are not a problem)
-- and only ever returns rows of auth.uid(). Restricted or removed documents drop out of the list.
create or replace view public.my_saved_resources
with (security_barrier = true) as
select
  r.id,
  r.title,
  r.university_id,
  u.name  as university_name,
  r.course_id,
  c.name  as course_name,
  c.code  as course_code,
  r.type_code,
  r.academic_year,
  r.exam_session,
  r.source_status,
  r.metadata_reviewed,
  r.correction_reviewed,
  exists (
    select 1
    from public.resource_relations rr
    join public.resources cr on cr.id = rr.resource_id
    where rr.related_id = r.id
      and rr.relation_type = 'correction_of'
      and cr.status = 'published'
  ) as has_correction,
  f.size_bytes,
  f.page_count,
  s.created_at as saved_at
from public.saved_resources s
join public.resources r on r.id = s.resource_id
join public.courses c on c.id = r.course_id
join public.universities u on u.id = r.university_id
left join public.resource_files f on f.resource_id = r.id and f.is_current
where s.user_id = auth.uid()
  and r.status = 'published';

revoke all on public.my_saved_resources from public, anon;
grant select on public.my_saved_resources to authenticated;

-- Explicit grants (new projects expose nothing by default). Harmless if 0010 already did this.
grant select, insert, delete on public.saved_resources to authenticated;
-- 0011: functions behind the home screen and the course page. All run as the caller (security invoker),
-- so the access rules apply: guests only ever see published resources.

-- For a program (and optionally one level): its courses against a list of academic years.
-- A cell has a paper when an exam or continuous assessment exists, and a correction when one exists for it.
create function public.course_coverage(
  p_program uuid,
  p_level text default null,
  p_years text[] default null,
  p_limit integer default 8
) returns table (
  course_id uuid, course_name text, course_code text, academic_year text, has_paper boolean, has_correction boolean
) language sql stable security invoker set search_path = public as $$
  with cs as (
    select distinct c.id, c.name, c.code
    from public.program_courses pc
    join public.courses c on c.id = pc.course_id
    where pc.program_id = p_program and (p_level is null or pc.level = p_level) and c.status = 'active'
    order by c.code nulls last, c.name
    limit least(greatest(coalesce(p_limit, 8), 1), 20)
  ),
  ys as (select unnest(coalesce(p_years, array[]::text[])) as y)
  select
    cs.id, cs.name, cs.code, ys.y,
    exists (
      select 1 from public.resources r
      where r.course_id = cs.id and r.academic_year = ys.y and r.type_code in ('exam', 'continuous_assessment')
    ),
    exists (
      select 1 from public.resources r
      where r.course_id = cs.id and r.academic_year = ys.y
        and (r.type_code = 'correction' or exists (
          select 1 from public.resource_relations rr
          join public.resources cr on cr.id = rr.resource_id
          where rr.related_id = r.id and rr.relation_type = 'correction_of' and cr.status = 'published'
        ))
    )
  from cs cross join ys
  order by cs.code nulls last, cs.name, ys.y desc
$$;

-- How many published resources of each type exist.
create function public.resource_counts() returns table (type_code text, total bigint)
language sql stable security invoker set search_path = public as $$
  select r.type_code, count(*) from public.resources r where r.status = 'published' group by r.type_code
$$;

-- The same row shape as search_resources, without rank and total.
create function public.recent_resources(p_limit integer default 5, p_university uuid default null)
returns table (
  id uuid, title text, university_id uuid, university_name text,
  course_id uuid, course_name text, course_code text, type_code text,
  academic_year text, exam_session text, source_status public.source_status,
  metadata_reviewed boolean, correction_reviewed boolean, has_correction boolean,
  size_bytes bigint, page_count integer
) language sql stable security invoker set search_path = public as $$
  select
    r.id, r.title, r.university_id, u.name, r.course_id, c.name, c.code, r.type_code,
    r.academic_year, r.exam_session, r.source_status, r.metadata_reviewed, r.correction_reviewed,
    (r.type_code = 'correction' or exists (
      select 1 from public.resource_relations rr join public.resources cr on cr.id = rr.resource_id
      where rr.related_id = r.id and rr.relation_type = 'correction_of' and cr.status = 'published'
    )),
    f.size_bytes, f.page_count
  from public.resources r
  join public.courses c on c.id = r.course_id
  join public.universities u on u.id = r.university_id
  left join lateral (
    select rf.size_bytes, rf.page_count from public.resource_files rf where rf.resource_id = r.id and rf.is_current limit 1
  ) f on true
  where r.status = 'published' and (p_university is null or r.university_id = p_university)
  order by r.published_at desc nulls last, r.id
  limit least(greatest(coalesce(p_limit, 5), 1), 20)
$$;

-- Everything published for one course, newest academic year first, optionally one type.
create function public.course_resources(p_course uuid, p_type text default null)
returns table (
  id uuid, title text, university_id uuid, university_name text,
  course_id uuid, course_name text, course_code text, type_code text,
  academic_year text, exam_session text, source_status public.source_status,
  metadata_reviewed boolean, correction_reviewed boolean, has_correction boolean,
  size_bytes bigint, page_count integer
) language sql stable security invoker set search_path = public as $$
  select
    r.id, r.title, r.university_id, u.name, r.course_id, c.name, c.code, r.type_code,
    r.academic_year, r.exam_session, r.source_status, r.metadata_reviewed, r.correction_reviewed,
    (r.type_code = 'correction' or exists (
      select 1 from public.resource_relations rr join public.resources cr on cr.id = rr.resource_id
      where rr.related_id = r.id and rr.relation_type = 'correction_of' and cr.status = 'published'
    )),
    f.size_bytes, f.page_count
  from public.resources r
  join public.courses c on c.id = r.course_id
  join public.universities u on u.id = r.university_id
  left join lateral (
    select rf.size_bytes, rf.page_count from public.resource_files rf where rf.resource_id = r.id and rf.is_current limit 1
  ) f on true
  where r.course_id = p_course and r.status = 'published' and (p_type is null or r.type_code = p_type)
  order by r.academic_year desc nulls last, r.published_at desc nulls last, r.id
  limit 200
$$;

grant execute on function public.course_coverage(uuid, text, text[], integer) to anon, authenticated;
grant execute on function public.resource_counts() to anon, authenticated;
grant execute on function public.recent_resources(integer, uuid) to anon, authenticated;
grant execute on function public.course_resources(uuid, text) to anon, authenticated;

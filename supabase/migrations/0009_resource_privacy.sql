-- 0009: keep personal and internal columns out of the public API.
-- Anyone who can read a published resource could also read who uploaded it and the contributor's private notes.
-- From now on the app can read only the columns below. Uploader, source note, moderation note and the rights flag
-- are reachable only through the functions at the end of this file.
-- When you add a column to resources that the app should read, add it to this grant.

revoke select on public.resources from anon, authenticated;
grant select (id, university_id, course_id, type_code, title, description, academic_year, year_unknown, exam_session,
  language, status, source_type, source_status, metadata_reviewed, correction_reviewed, ai_assisted, duplicate_of,
  search_text, published_at, created_at, updated_at)
  on public.resources to anon, authenticated;

-- The search function must name its columns now: "r.*" would need access to the hidden ones.
create or replace function public.search_resources(
  p_query text default null,
  p_university uuid default null,
  p_program uuid default null,
  p_level text default null,
  p_semester integer default null,
  p_type text default null,
  p_year text default null,
  p_has_correction boolean default null,
  p_limit integer default 20,
  p_offset integer default 0
) returns table (
  id uuid, title text, university_id uuid, university_name text,
  course_id uuid, course_name text, course_code text, type_code text,
  academic_year text, exam_session text, source_status public.source_status,
  metadata_reviewed boolean, correction_reviewed boolean, has_correction boolean,
  size_bytes bigint, page_count integer, rank real, total_count bigint
) language sql stable security invoker set search_path = public, extensions as $$
  with params as (
    select nullif(lower(public.f_unaccent(btrim(coalesce(p_query, '')))), '') as q
  ),
  candidates as (
    select
      r.id, r.title, r.university_id, r.course_id, r.type_code, r.academic_year, r.exam_session,
      r.source_status, r.metadata_reviewed, r.correction_reviewed, r.search_text, r.published_at,
      c.name as c_name, c.code as c_code, u.name as u_name, params.q,
      (r.type_code = 'correction' or exists (
        select 1 from public.resource_relations rr
        join public.resources cr on cr.id = rr.resource_id
        where rr.related_id = r.id and rr.relation_type = 'correction_of' and cr.status = 'published'
      )) as has_corr,
      coalesce((select max(similarity(lower(public.f_unaccent(a.alias)), params.q))
                from public.course_aliases a where a.course_id = c.id), 0) as alias_sim
    from public.resources r
    join public.courses c on c.id = r.course_id
    join public.universities u on u.id = r.university_id
    cross join params
    where (p_university is null or r.university_id = p_university)
      and (p_type is null or r.type_code = p_type)
      and (p_year is null or r.academic_year = p_year)
      and (
        (p_program is null and p_level is null and p_semester is null)
        or exists (
          select 1 from public.program_courses pc
          where pc.course_id = c.id
            and (p_program is null or pc.program_id = p_program)
            and (p_level is null or pc.level = p_level)
            and (p_semester is null or pc.semester = p_semester)
        )
      )
  ),
  scored as (
    select
      cd.*,
      case when cd.q is null then 0 else
          (case when replace(lower(coalesce(cd.c_code, '')), ' ', '') = replace(cd.q, ' ', '') then 100 else 0 end)
        + 40 * greatest(similarity(lower(public.f_unaccent(cd.c_name)), cd.q), cd.alias_sim)
        + 20 * similarity(cd.search_text, cd.q)
      end
      + case when cd.source_status <> 'unverified' then 5 else 0 end
      + case when cd.metadata_reviewed then 3 else 0 end
      + coalesce(substr(cd.academic_year, 6, 4)::int - 2000, 0) * 0.1 as score
    from candidates cd
    where cd.q is null
      or lower(public.f_unaccent(cd.c_name)) like '%' || cd.q || '%'
      or replace(lower(coalesce(cd.c_code, '')), ' ', '') like '%' || replace(cd.q, ' ', '') || '%'
      or cd.search_text like '%' || cd.q || '%'
      or cd.alias_sim > 0.3
      or similarity(lower(public.f_unaccent(cd.c_name)), cd.q) > 0.25
  )
  select
    s.id, s.title, s.university_id, s.u_name, s.course_id, s.c_name, s.c_code, s.type_code,
    s.academic_year, s.exam_session, s.source_status, s.metadata_reviewed, s.correction_reviewed,
    s.has_corr, f.size_bytes, f.page_count, s.score::real, count(*) over ()
  from scored s
  left join lateral (
    select rf.size_bytes, rf.page_count from public.resource_files rf
    where rf.resource_id = s.id and rf.is_current limit 1
  ) f on true
  where p_has_correction is null or s.has_corr = p_has_correction
  order by s.score desc, s.published_at desc nulls last, s.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

-- A contributor reads their own submissions, including the rejection reason (FR-018).
create function public.my_submissions() returns setof public.resources
language sql stable security definer set search_path = '' as $$
  select * from public.resources where uploader_id = auth.uid() order by created_at desc
$$;

-- Moderators read the review queue with every column.
create function public.moderation_queue(p_status public.resource_status default 'submitted')
returns setof public.resources
language sql stable security definer set search_path = '' as $$
  select * from public.resources where public.is_moderator() and status = p_status order by created_at
$$;

revoke execute on function public.my_submissions() from public, anon;
revoke execute on function public.moderation_queue(public.resource_status) from public, anon;
grant execute on function public.my_submissions() to authenticated;
grant execute on function public.moderation_queue(public.resource_status) to authenticated;

-- A policy that looks inside resources as the caller would now need the hidden uploader column.
-- This helper does the check as the database owner instead.
create function public.is_own_submission(p_resource_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.resources
    where id = p_resource_id and uploader_id = auth.uid() and status = 'submitted'
  )
$$;

drop policy resource_files_insert_own on public.resource_files;
create policy resource_files_insert_own on public.resource_files for insert to authenticated
  with check (
    public.is_own_submission(resource_id)
    and processing_status = 'pending' and sha256 is null and is_current
    and storage_path like 'incoming/' || auth.uid()::text || '/%'
  );

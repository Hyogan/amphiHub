-- Moderation, upload finalization and search.

-- Internal helper. Not callable from the app.
create function public.write_audit(p_action text, p_entity text, p_entity_id uuid, p_before jsonb, p_after jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, before, after)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_before, p_after)
$$;
revoke execute on function public.write_audit(text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

-- Moves a resource through its lifecycle. Moderators only. Every change is audited.
create function public.moderate_resource(p_resource_id uuid, p_action text, p_reason text default null)
returns public.resources language plpgsql security definer set search_path = '' as $$
declare
  r public.resources;
  next_status public.resource_status;
  before_row jsonb;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into r from public.resources where id = p_resource_id for update;
  if not found then
    raise exception 'resource not found' using errcode = 'P0002';
  end if;

  next_status := case
    when p_action = 'start_review' and r.status = 'submitted' then 'in_review'::public.resource_status
    when p_action = 'publish' and r.status in ('submitted', 'in_review') then 'published'::public.resource_status
    when p_action = 'reject' and r.status in ('submitted', 'in_review') then 'rejected'::public.resource_status
    when p_action = 'restrict' and r.status = 'published' then 'restricted'::public.resource_status
    when p_action = 'restore' and r.status = 'restricted' then 'published'::public.resource_status
    when p_action = 'remove' and r.status in ('published', 'restricted') then 'removed'::public.resource_status
    else null
  end;
  if next_status is null then
    raise exception 'invalid action % for status %', p_action, r.status using errcode = '22023';
  end if;

  if p_action in ('reject', 'restrict', 'remove') and coalesce(btrim(p_reason), '') = '' then
    raise exception 'a reason is required' using errcode = '22023';
  end if;

  if p_action = 'publish' then
    if not exists (
      select 1 from public.resource_files f
      where f.resource_id = r.id and f.is_current and f.processing_status = 'ready'
    ) then
      raise exception 'the file is not ready' using errcode = '22023';
    end if;
    if r.duplicate_of is not null and coalesce(btrim(p_reason), '') = '' then
      raise exception 'flagged as a duplicate: give a reason to publish anyway' using errcode = '22023';
    end if;
  end if;

  before_row := to_jsonb(r);
  update public.resources set
    status = next_status,
    published_at = case when next_status = 'published' and published_at is null then now() else published_at end,
    moderation_note = coalesce(nullif(btrim(p_reason), ''), moderation_note)
  where id = r.id
  returning * into r;

  perform public.write_audit('resource_' || p_action, 'resource', r.id, before_row, to_jsonb(r));
  return r;
end $$;

-- Sets the separate verification attributes. Moderators only. "Official" needs a written evidence note.
create function public.set_resource_verification(
  p_resource_id uuid,
  p_metadata_reviewed boolean default null,
  p_source_status public.source_status default null,
  p_correction_reviewed boolean default null,
  p_note text default null
) returns public.resources language plpgsql security definer set search_path = '' as $$
declare
  r public.resources;
  before_row jsonb;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_source_status = 'official_confirmed' and coalesce(btrim(p_note), '') = '' then
    raise exception 'official source needs an evidence note' using errcode = '22023';
  end if;

  select * into r from public.resources where id = p_resource_id for update;
  if not found then
    raise exception 'resource not found' using errcode = 'P0002';
  end if;
  before_row := to_jsonb(r);

  update public.resources set
    metadata_reviewed = coalesce(p_metadata_reviewed, metadata_reviewed),
    source_status = coalesce(p_source_status, source_status),
    correction_reviewed = coalesce(p_correction_reviewed, correction_reviewed),
    source_type = case when p_source_status = 'official_confirmed' then 'official_source'::public.source_type else source_type end
  where id = r.id
  returning * into r;

  perform public.write_audit('resource_verification', 'resource', r.id, before_row, to_jsonb(r) || jsonb_build_object('note', p_note));
  return r;
end $$;

-- Called by the app after the PDF is uploaded. The hash from the phone is only a hint:
-- a server-side check will confirm it before publishing is automated.
create function public.finalize_resource_file(p_file_id uuid, p_sha256 text, p_page_count integer default null)
returns public.resource_files language plpgsql security definer set search_path = '' as $$
declare
  f public.resource_files;
  res public.resources;
  other_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid hash' using errcode = '22023';
  end if;

  select * into f from public.resource_files where id = p_file_id for update;
  if not found then
    raise exception 'file not found' using errcode = 'P0002';
  end if;
  select * into res from public.resources where id = f.resource_id;
  if not (public.is_moderator() or (res.uploader_id = auth.uid() and res.status = 'submitted')) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.resource_files set sha256 = p_sha256, page_count = coalesce(p_page_count, page_count), processing_status = 'ready'
  where id = f.id returning * into f;

  -- Flag a likely duplicate for review. Similar files are never merged automatically.
  select rf.resource_id into other_id
  from public.resource_files rf
  join public.resources r on r.id = rf.resource_id
  where rf.sha256 = p_sha256 and rf.resource_id <> res.id and r.status not in ('rejected', 'removed')
  order by r.created_at limit 1;

  if other_id is not null then
    update public.resources set duplicate_of = other_id where id = res.id;
    perform public.write_audit('duplicate_flagged', 'resource', res.id, null, jsonb_build_object('duplicate_of', other_id));
  end if;
  return f;
end $$;

-- Search. Runs as the caller, so the access rules apply: guests only ever see published resources.
create function public.search_resources(
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
      r.*, c.name as c_name, c.code as c_code, u.name as u_name, params.q,
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

-- Finds courses by name, code or alias, for the contribution form.
create function public.search_courses(p_query text, p_university uuid default null, p_limit integer default 10)
returns table (id uuid, university_id uuid, name text, code text, rank real)
language sql stable security invoker set search_path = public, extensions as $$
  with params as (select nullif(lower(public.f_unaccent(btrim(coalesce(p_query, '')))), '') as q)
  select c.id, c.university_id, c.name, c.code,
    (case when replace(lower(coalesce(c.code, '')), ' ', '') = replace(params.q, ' ', '') then 100 else 0 end
     + 40 * greatest(similarity(lower(public.f_unaccent(c.name)), params.q),
         coalesce((select max(similarity(lower(public.f_unaccent(a.alias)), params.q)) from public.course_aliases a where a.course_id = c.id), 0)))::real as rank
  from public.courses c cross join params
  where params.q is not null
    and (p_university is null or c.university_id = p_university)
    and (
      lower(public.f_unaccent(c.name)) like '%' || params.q || '%'
      or replace(lower(coalesce(c.code, '')), ' ', '') like '%' || replace(params.q, ' ', '') || '%'
      or exists (select 1 from public.course_aliases a where a.course_id = c.id and lower(public.f_unaccent(a.alias)) like '%' || params.q || '%')
      or similarity(lower(public.f_unaccent(c.name)), params.q) > 0.25
    )
  order by rank desc, c.name
  limit least(greatest(coalesce(p_limit, 10), 1), 30)
$$;

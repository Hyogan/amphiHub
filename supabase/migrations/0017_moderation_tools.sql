-- 1. No self-approval. Same as 0006, plus one check. A moderator cannot publish or restore their own upload.
create or replace function public.moderate_resource(p_resource_id uuid, p_action text, p_reason text default null)
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

  if r.uploader_id = auth.uid() and p_action in ('publish', 'restore') and not public.is_admin() then
    raise exception 'moderators cannot approve their own submission' using errcode = '42501';
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

-- 2. Same for verification labels. Same as 0006, plus the self-approval check.
create or replace function public.set_resource_verification(
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
  if r.uploader_id = auth.uid() and not public.is_admin() then
    raise exception 'moderators cannot verify their own submission' using errcode = '42501';
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

-- 3. Reports queue. Reporter identity is left out on purpose.
create or replace view public.moderation_reports
with (security_barrier = true) as
select
  rp.id,
  rp.resource_id,
  r.title as resource_title,
  r.status as resource_status,
  c.name as course_name,
  u.name as university_name,
  rp.reason,
  rp.details,
  rp.status,
  rp.resolution,
  rp.created_at,
  rp.resolved_at,
  (select count(*) from public.reports x where x.resource_id = rp.resource_id and x.status = 'open') as open_on_resource
from public.reports rp
join public.resources r on r.id = rp.resource_id
join public.courses c on c.id = r.course_id
join public.universities u on u.id = r.university_id
where public.is_moderator();

revoke all on public.moderation_reports from public, anon;
grant select on public.moderation_reports to authenticated;

create or replace function public.resolve_report(p_report_id uuid, p_decision text, p_resolution text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  rp public.reports;
  before_row jsonb;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_decision not in ('resolved', 'dismissed') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  if coalesce(btrim(p_resolution), '') = '' then
    raise exception 'a note is required' using errcode = '22023';
  end if;
  select * into rp from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
  if rp.status <> 'open' then
    raise exception 'report already closed' using errcode = '22023';
  end if;
  before_row := to_jsonb(rp);
  update public.reports
    set status = p_decision, resolution = btrim(p_resolution), resolved_at = now()
    where id = rp.id returning * into rp;
  perform public.write_audit('report_' || p_decision, 'report', rp.id, before_row, to_jsonb(rp));
end $$;

-- 4. Course suggestions. Assumes courses(university_id, name, code) are the only columns without a default.
create or replace view public.moderation_suggestions
with (security_barrier = true) as
select s.id, s.university_id, u.name as university_name, s.kind, s.payload, s.status, s.created_at
from public.catalog_suggestions s
left join public.universities u on u.id = s.university_id
where public.is_moderator();

revoke all on public.moderation_suggestions from public, anon;
grant select on public.moderation_suggestions to authenticated;

create or replace function public.review_course_suggestion(
  p_suggestion_id uuid,
  p_decision text,
  p_name text default null,
  p_code text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.catalog_suggestions;
  before_row jsonb;
  new_course_id uuid;
  v_name text;
  v_code text;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_decision not in ('accept', 'reject') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;
  select * into s from public.catalog_suggestions where id = p_suggestion_id for update;
  if not found then
    raise exception 'suggestion not found' using errcode = 'P0002';
  end if;
  if s.status <> 'pending' then
    raise exception 'suggestion already reviewed' using errcode = '22023';
  end if;
  before_row := to_jsonb(s);

  if p_decision = 'accept' then
    if s.kind <> 'course' or s.university_id is null then
      raise exception 'only course suggestions can be accepted here' using errcode = '22023';
    end if;
    v_name := btrim(coalesce(nullif(btrim(p_name), ''), s.payload ->> 'name', ''));
    v_code := nullif(btrim(coalesce(p_code, s.payload ->> 'code', '')), '');
    if char_length(v_name) < 3 then
      raise exception 'the course needs a name' using errcode = '22023';
    end if;
    insert into public.courses (university_id, name, code)
      values (s.university_id, v_name, v_code) returning id into new_course_id;
    update public.catalog_suggestions set status = 'accepted' where id = s.id;
    perform public.write_audit('suggestion_accept', 'suggestion', s.id, before_row,
      jsonb_build_object('course_id', new_course_id, 'name', v_name, 'code', v_code));
  else
    update public.catalog_suggestions set status = 'rejected' where id = s.id;
    perform public.write_audit('suggestion_reject', 'suggestion', s.id, before_row, null);
  end if;
end $$;

-- 5. Grants for the new functions.
revoke all on function public.resolve_report(uuid, text, text) from public, anon;
revoke all on function public.review_course_suggestion(uuid, text, text, text) from public, anon;
grant execute on function public.resolve_report(uuid, text, text) to authenticated;
grant execute on function public.review_course_suggestion(uuid, text, text, text) to authenticated;

-- 6. Moderators change reports and suggestions only through the functions above, which write the audit log.
revoke update on public.reports from authenticated;
revoke update on public.catalog_suggestions from authenticated;
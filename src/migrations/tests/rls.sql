-- Access-rule tests. Run ONLY on a local or throwaway database (supabase start), never on production:
--   psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
-- It creates test users and data inside a transaction and rolls everything back at the end.
-- Needs supabase/seed.sql loaded first.

begin;

create schema test;

create function test.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

create function test.guest() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  set local role anon;
end $$;

create function test.admin() returns void language plpgsql as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
end $$;

create function test.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is not true then
    raise exception 'FAILED: %', label;
  end if;
  raise notice 'ok: %', label;
end $$;

-- Runs a statement and reports whether it raised an error.
create function test.fails(sql text) returns boolean language plpgsql as $$
begin
  execute sql;
  return false;
exception when others then
  return true;
end $$;

grant usage on schema test to anon, authenticated;
grant execute on all functions in schema test to anon, authenticated;

-- ── Fixtures (as the database owner) ──────────────────────────────────────────
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 'alice@test.cm'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', 'bob@test.cm'),
  ('cccccccc-0000-4000-8000-00000000000c', 'mod@test.cm');
update public.user_roles set role = 'moderator' where user_id = 'cccccccc-0000-4000-8000-00000000000c';
insert into public.user_roles (user_id, role) values ('cccccccc-0000-4000-8000-00000000000c', 'student');

select test.check((select count(*) from public.profiles where id = 'aaaaaaaa-0000-4000-8000-00000000000a') = 1, 'new user gets a profile');
select test.check((select role from public.user_roles where user_id = 'aaaaaaaa-0000-4000-8000-00000000000a') = 'student', 'new user is a student');

-- ── A contributor submits ─────────────────────────────────────────────────────
select test.login('aaaaaaaa-0000-4000-8000-00000000000a');

insert into public.resources (id, university_id, course_id, type_code, title, academic_year, rights_declared, uploader_id)
values ('dddddddd-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031',
        'exam', 'TEST Algorithmique examen 2020', '2019-2020', true, 'aaaaaaaa-0000-4000-8000-00000000000a');
select test.check(true, 'contributor can submit a plain resource');

select test.check(test.fails($q$
  insert into public.resources (university_id, course_id, type_code, title, rights_declared, uploader_id, status)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'exam', 'TEST self publish', true,
          'aaaaaaaa-0000-4000-8000-00000000000a', 'published')
$q$), 'contributor cannot submit as already published');

select test.check(test.fails($q$
  insert into public.resources (university_id, course_id, type_code, title, rights_declared, uploader_id)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'exam', 'TEST as bob', true,
          'bbbbbbbb-0000-4000-8000-00000000000b')
$q$), 'contributor cannot submit in someone else''s name');

select test.check(test.fails($q$
  insert into public.resources (university_id, course_id, type_code, title, rights_declared, uploader_id)
  values ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000031', 'exam', 'TEST wrong university', true,
          'aaaaaaaa-0000-4000-8000-00000000000a')
$q$), 'a course must belong to the resource''s university');

select test.check(test.fails($q$
  insert into public.resources (university_id, course_id, type_code, title, rights_declared, uploader_id)
  values ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'exam', 'TEST no rights', false,
          'aaaaaaaa-0000-4000-8000-00000000000a')
$q$), 'rights declaration is required');

insert into public.resource_files (id, resource_id, storage_path, size_bytes)
values ('eeeeeeee-0000-4000-8000-000000000001', 'dddddddd-0000-4000-8000-000000000001',
        'incoming/aaaaaaaa-0000-4000-8000-00000000000a/eeeeeeee-0000-4000-8000-000000000001.pdf', 1000);
select test.check(true, 'contributor can attach a file in their own folder');

select test.check(test.fails($q$
  insert into public.resource_files (resource_id, storage_path, size_bytes)
  values ('dddddddd-0000-4000-8000-000000000001', 'incoming/bbbbbbbb-0000-4000-8000-00000000000b/x.pdf', 1000)
$q$), 'contributor cannot attach a file in another folder');

-- The contributor cannot change the status or verification directly.
update public.resources set status = 'published' where id = 'dddddddd-0000-4000-8000-000000000001';
select test.check((select count(*) from public.resources where id = 'dddddddd-0000-4000-8000-000000000001' and status = 'published') = 0,
  'contributor cannot publish by updating the row');
select test.check(test.fails($q$ select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'publish') $q$),
  'contributor cannot call moderate_resource');

-- ── Who can see it ────────────────────────────────────────────────────────────
select test.check((select count(*) from public.resources where title like 'TEST%') = 1, 'contributor sees their own submission');

select test.login('bbbbbbbb-0000-4000-8000-00000000000b');
select test.check((select count(*) from public.resources where title like 'TEST%') = 0, 'another student cannot see an unpublished submission');

select test.guest();
select test.check((select count(*) from public.resources where title like 'TEST%') = 0, 'guest cannot see an unpublished submission');
select test.check((select count(*) from public.resources where status = 'published') >= 8, 'guest sees published resources');
select test.check(test.fails($q$ select * from public.audit_log $q$), 'guest cannot read the audit log');
select test.check(test.fails($q$ select * from public.profiles $q$), 'guest cannot read profiles');

-- ── Moderation ───────────────────────────────────────────────────────────────
select test.login('cccccccc-0000-4000-8000-00000000000c');
select test.check((select count(*) from public.resources where title like 'TEST%') = 1, 'moderator sees the submission');
select test.check(test.fails($q$ select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'publish') $q$),
  'cannot publish before the file is ready');

select test.login('aaaaaaaa-0000-4000-8000-00000000000a');
select public.finalize_resource_file('eeeeeeee-0000-4000-8000-000000000001', repeat('a', 64), 4);
select test.check((select processing_status from public.resource_files where id = 'eeeeeeee-0000-4000-8000-000000000001') = 'ready', 'finalize marks the file ready');

select test.login('cccccccc-0000-4000-8000-00000000000c');
select test.check(test.fails($q$ select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'reject') $q$), 'rejecting needs a reason');
select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'start_review');
select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'publish');
select test.check((select status from public.resources where id = 'dddddddd-0000-4000-8000-000000000001') = 'published', 'moderator can publish');
select test.check((select count(*) from public.audit_log where entity_id = 'dddddddd-0000-4000-8000-000000000001') = 2, 'each moderation action is audited');
select test.check(test.fails($q$ select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'start_review') $q$), 'invalid transition is refused');

select test.guest();
select test.check((select count(*) from public.resources where title like 'TEST%') = 1, 'guest sees it once published');

select test.login('aaaaaaaa-0000-4000-8000-00000000000a');
select test.check((select count(*) from public.audit_log) = 0, 'a student cannot read the audit log');

-- ── Duplicate detection ───────────────────────────────────────────────────────
select test.login('bbbbbbbb-0000-4000-8000-00000000000b');
insert into public.resources (id, university_id, course_id, type_code, title, academic_year, rights_declared, uploader_id)
values ('dddddddd-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031',
        'exam', 'TEST Algorithmique examen 2020 bis', '2019-2020', true, 'bbbbbbbb-0000-4000-8000-00000000000b');
insert into public.resource_files (id, resource_id, storage_path, size_bytes)
values ('eeeeeeee-0000-4000-8000-000000000002', 'dddddddd-0000-4000-8000-000000000002',
        'incoming/bbbbbbbb-0000-4000-8000-00000000000b/eeeeeeee-0000-4000-8000-000000000002.pdf', 1000);
select public.finalize_resource_file('eeeeeeee-0000-4000-8000-000000000002', repeat('a', 64), 4);

select test.login('cccccccc-0000-4000-8000-00000000000c');
select test.check((select duplicate_of from public.resources where id = 'dddddddd-0000-4000-8000-000000000002') = 'dddddddd-0000-4000-8000-000000000001',
  'same file hash flags a duplicate');
select test.check(test.fails($q$ select public.moderate_resource('dddddddd-0000-4000-8000-000000000002', 'publish') $q$),
  'a flagged duplicate needs a reason to publish');
select public.moderate_resource('dddddddd-0000-4000-8000-000000000002', 'publish', 'Different session, same scan');
select test.check(true, 'a flagged duplicate can be published with a reason');

-- ── Verification labels ──────────────────────────────────────────────────────
select test.check(test.fails($q$ select public.set_resource_verification('dddddddd-0000-4000-8000-000000000001', null, 'official_confirmed') $q$),
  'official needs an evidence note');
select public.set_resource_verification('dddddddd-0000-4000-8000-000000000001', true, 'confirmed', null, 'checked with the department');
select test.check((select metadata_reviewed and source_status = 'confirmed' from public.resources where id = 'dddddddd-0000-4000-8000-000000000001'),
  'moderator can set verification attributes');

-- ── Personal library ─────────────────────────────────────────────────────────
select test.login('bbbbbbbb-0000-4000-8000-00000000000b');
insert into public.saved_resources (user_id, resource_id) values ('bbbbbbbb-0000-4000-8000-00000000000b', 'dddddddd-0000-4000-8000-000000000001');
select test.check((select count(*) from public.saved_resources) = 1, 'a user can save a published resource');
select test.check(test.fails($q$ insert into public.saved_resources (user_id, resource_id) values ('aaaaaaaa-0000-4000-8000-00000000000a', 'dddddddd-0000-4000-8000-000000000001') $q$),
  'a user cannot save in someone else''s library');
select test.login('aaaaaaaa-0000-4000-8000-00000000000a');
select test.check((select count(*) from public.saved_resources) = 0, 'a user cannot see another user''s library');

-- ── Profiles and roles ───────────────────────────────────────────────────────
update public.profiles set display_name = 'Alice' where id = 'aaaaaaaa-0000-4000-8000-00000000000a';
select test.check((select display_name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-00000000000a') = 'Alice', 'a user can edit their own profile');
update public.profiles set display_name = 'Hacked' where id = 'bbbbbbbb-0000-4000-8000-00000000000b';
select test.check((select count(*) from public.profiles) = 1, 'a user cannot see or edit another profile');
select test.check(test.fails($q$ update public.profiles set created_at = now() where id = 'aaaaaaaa-0000-4000-8000-00000000000a' $q$), 'a user cannot edit protected profile columns');
select test.check(test.fails($q$ insert into public.user_roles (user_id, role) values ('aaaaaaaa-0000-4000-8000-00000000000a', 'admin') $q$), 'a user cannot grant themselves a role');
select test.check(test.fails($q$ update public.universities set name = 'x' $q$) or (select count(*) from public.universities where name = 'x') = 0, 'a student cannot edit the catalogue');

-- ── Analytics ────────────────────────────────────────────────────────────────
select test.guest();
insert into public.analytics_events (name, props) values ('search_submitted', '{"q":"inf"}');
select test.check(true, 'a guest can record an event');
select test.check(test.fails($q$ select * from public.analytics_events $q$), 'a guest cannot read events');

select test.check(test.fails($q$ select storage_path from public.resource_files $q$), 'a guest cannot read storage paths');
select test.check((select count(*) from public.resource_files where size_bytes > 0) >= 1, 'a guest can read file size');

-- ── Search ───────────────────────────────────────────────────────────────────
select test.check((select count(*) from public.search_resources('INF 201')) >= 3, 'search finds a course by code');
select test.check((select count(*) from public.search_resources('inf201')) >= 3, 'search ignores the space in a code');
select test.check((select count(*) from public.search_resources('reseaux')) = 1, 'search ignores accents');
select test.check((select count(*) from public.search_resources('Algo')) >= 3, 'search finds a course by alias');
select test.check((select count(*) from public.search_resources(null, null, null, 'L2', null, 'exam')) >= 3, 'filters by level and type work');
select test.check((select count(*) from public.search_resources('Algorithmique', p_has_correction => true)) = 2, 'has-correction filter keeps the paper and the correction');
select test.check((select title from public.search_resources('INF 201') order by rank desc limit 1) is not null, 'search returns ranked rows');
select test.check((select count(*) from public.search_resources('zzzzzz')) = 0, 'an unknown query returns nothing');
select test.check((select count(*) from public.search_courses('bd')) = 2, 'course search by alias finds both universities');

-- ── Storage ──────────────────────────────────────────────────────────────────
select test.admin();
insert into storage.objects (bucket_id, name) values
  ('resources', 'incoming/aaaaaaaa-0000-4000-8000-00000000000a/eeeeeeee-0000-4000-8000-000000000001.pdf'),
  ('resources', 'incoming/bbbbbbbb-0000-4000-8000-00000000000b/private.pdf');
select test.login('bbbbbbbb-0000-4000-8000-00000000000b');
select test.check((select count(*) from storage.objects where name like '%eeeeeeee-0000-4000-8000-000000000001.pdf') = 1, 'any signed-in user can read a published file');
select test.check((select count(*) from storage.objects where name like '%private.pdf') = 1, 'the owner can read their own pending file');
select test.login('aaaaaaaa-0000-4000-8000-00000000000a');
select test.check((select count(*) from storage.objects where name like '%private.pdf') = 0, 'another user cannot read a pending file');
select test.guest();
select test.check((select count(*) from storage.objects) = 0, 'a guest cannot read any file');

-- Restricting a resource removes access at once.
select test.login('cccccccc-0000-4000-8000-00000000000c');
select public.moderate_resource('dddddddd-0000-4000-8000-000000000001', 'restrict', 'Rights claim under review');
select test.login('bbbbbbbb-0000-4000-8000-00000000000b');
select test.check((select count(*) from storage.objects where name like '%eeeeeeee-0000-4000-8000-000000000001.pdf') = 0, 'a restricted resource loses file access immediately');
select test.check((select count(*) from public.resources where id = 'dddddddd-0000-4000-8000-000000000001') = 0, 'a restricted resource disappears from lists');

rollback;

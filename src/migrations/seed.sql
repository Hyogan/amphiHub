-- DEMO catalogue and resources, so the interface can be built before the real catalogue exists.
-- The two universities are real. The faculties, programs, courses and codes below are PLACEHOLDERS:
-- replace them with the real first programs and courses before the pilot.
-- Demo resources have no file, so they appear in lists but cannot be downloaded.

insert into public.universities (id, name, short_name) values
  ('00000000-0000-4000-8000-000000000001', 'Université de Dschang', 'UDs'),
  ('00000000-0000-4000-8000-000000000002', 'Université de Douala', 'UDo');

insert into public.academic_units (id, university_id, name, unit_type) values
  ('00000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000001', 'Faculté des Sciences', 'faculty'),
  ('00000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000002', 'Faculté des Sciences', 'faculty');

insert into public.programs (id, university_id, unit_id, name, degree_type) values
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'Informatique', 'Licence'),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'Informatique', 'Licence'),
  ('00000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012', 'Mathématiques', 'Licence');

insert into public.courses (id, university_id, name, code) values
  ('00000000-0000-4000-8000-000000000031', '00000000-0000-4000-8000-000000000001', 'Algorithmique et structures de données', 'INF 201'),
  ('00000000-0000-4000-8000-000000000032', '00000000-0000-4000-8000-000000000001', 'Bases de données', 'INF 232'),
  ('00000000-0000-4000-8000-000000000033', '00000000-0000-4000-8000-000000000002', 'Réseaux informatiques', 'INF 301'),
  ('00000000-0000-4000-8000-000000000034', '00000000-0000-4000-8000-000000000002', 'Analyse 2', 'MAT 102'),
  ('00000000-0000-4000-8000-000000000035', '00000000-0000-4000-8000-000000000001', 'Optique géométrique', 'PHY 105'),
  ('00000000-0000-4000-8000-000000000036', '00000000-0000-4000-8000-000000000002', 'Bases de données', 'INF 232');

insert into public.program_courses (program_id, course_id, level, semester) values
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000031', 'L2', 3),
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000032', 'L2', 4),
  ('00000000-0000-4000-8000-000000000021', '00000000-0000-4000-8000-000000000035', 'L1', 1),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000033', 'L3', 5),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000036', 'L2', 4),
  ('00000000-0000-4000-8000-000000000022', '00000000-0000-4000-8000-000000000034', 'L1', 2),
  ('00000000-0000-4000-8000-000000000023', '00000000-0000-4000-8000-000000000034', 'L1', 2);

insert into public.course_aliases (course_id, alias, language) values
  ('00000000-0000-4000-8000-000000000031', 'Algo', 'fr'),
  ('00000000-0000-4000-8000-000000000032', 'BD', 'fr'),
  ('00000000-0000-4000-8000-000000000032', 'Database', 'en'),
  ('00000000-0000-4000-8000-000000000036', 'BD', 'fr'),
  ('00000000-0000-4000-8000-000000000034', 'Analyse', 'fr'),
  ('00000000-0000-4000-8000-000000000033', 'Networks', 'en');

insert into public.resources
  (id, university_id, course_id, type_code, title, description, academic_year, year_unknown, exam_session,
   language, status, source_type, source_status, metadata_reviewed, correction_reviewed, rights_declared, published_at)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'exam', 'Algorithmique, examen final', 'DEMO', '2023-2024', false, 'normal', 'fr', 'published', 'community_upload', 'confirmed', true, false, true, now()),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'correction', 'Algorithmique, correction de l’examen final', 'DEMO', '2023-2024', false, 'normal', 'fr', 'published', 'community_upload', 'unverified', true, true, true, now()),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'exam', 'Algorithmique, examen de rattrapage', 'DEMO', '2022-2023', false, 'retake', 'fr', 'published', 'community_upload', 'unverified', true, false, true, now()),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000031', 'td', 'TD n°2 : arbres et graphes', 'DEMO', '2022-2023', false, null, 'fr', 'published', 'community_upload', 'unverified', false, false, true, now()),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000036', 'td', 'Bases de données, TD n°3 : jointures et agrégats', 'DEMO', '2023-2024', false, null, 'fr', 'published', 'community_upload', 'unverified', true, false, true, now()),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000034', 'continuous_assessment', 'Analyse 2, contrôle continu', 'DEMO', '2022-2023', false, 'retake', 'fr', 'published', 'community_upload', 'unverified', false, false, true, now()),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000035', 'tp', 'Optique géométrique, compte rendu de TP', 'DEMO', '2021-2022', false, null, 'fr', 'published', 'official_source', 'official_confirmed', true, false, true, now()),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000033', 'lecture_notes', 'Introduction aux réseaux, notes de cours', 'DEMO', null, true, null, 'fr', 'published', 'community_upload', 'confirmed', false, false, true, now());

insert into public.resource_relations (resource_id, related_id, relation_type) values
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000101', 'correction_of');

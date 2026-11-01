-- Academic catalogue. Rows are deactivated, never deleted, so resources keep valid links.

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null,
  country_code text not null default 'CM',
  primary_language text not null default 'fr' check (primary_language in ('fr', 'en')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- Faculties, schools, institutes and departments. The parent link allows different hierarchies.
create table public.academic_units (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  parent_id uuid references public.academic_units (id) on delete restrict,
  name text not null,
  unit_type text not null default 'faculty' check (unit_type in ('faculty', 'school', 'institute', 'department', 'other')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index academic_units_university_idx on public.academic_units (university_id);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  unit_id uuid references public.academic_units (id) on delete restrict,
  name text not null,
  code text,
  degree_type text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
create index programs_university_idx on public.programs (university_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  name text not null,
  code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);
-- A course code is only unique inside one university.
create unique index courses_university_code_key on public.courses (university_id, lower(code)) where code is not null;

-- A course can belong to several programs, at different levels and semesters.
create table public.program_courses (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  level text not null,
  semester smallint check (semester between 1 and 12),
  curriculum_label text
);
create unique index program_courses_key on public.program_courses (program_id, course_id, coalesce(curriculum_label, ''));
create index program_courses_course_idx on public.program_courses (course_id);

create table public.course_aliases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  alias text not null,
  language text check (language in ('fr', 'en'))
);
create index course_aliases_course_idx on public.course_aliases (course_id);

-- Resource categories live in data, not in code, so they can change without a migration.
create table public.resource_types (
  code text primary key,
  label_fr text not null,
  label_en text not null,
  sort smallint not null default 100,
  active boolean not null default true
);

insert into public.resource_types (code, label_fr, label_en, sort) values
  ('exam', 'Examen', 'Exam', 10),
  ('continuous_assessment', 'Contrôle continu', 'Continuous assessment', 20),
  ('correction', 'Correction', 'Correction', 30),
  ('td', 'TD', 'Tutorial (TD)', 40),
  ('tp', 'TP', 'Lab (TP)', 50),
  ('lecture_notes', 'Cours', 'Lecture notes', 60),
  ('other', 'Autre', 'Other', 90);

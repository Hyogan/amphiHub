-- Resources and everything around them.

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  course_id uuid not null references public.courses (id) on delete restrict,
  type_code text not null references public.resource_types (code),
  title text not null check (char_length(title) between 3 and 200),
  description text check (char_length(description) <= 2000),
  academic_year text check (academic_year ~ '^\d{4}-\d{4}$'),
  year_unknown boolean not null default false,
  exam_session text check (exam_session in ('normal', 'retake', 'other')),
  language text check (language in ('fr', 'en')),
  status public.resource_status not null default 'submitted',
  -- Verification is a set of separate attributes, never one status.
  source_type public.source_type not null default 'community_upload',
  source_note text check (char_length(source_note) <= 1000),
  source_status public.source_status not null default 'unverified',
  metadata_reviewed boolean not null default false,
  correction_reviewed boolean not null default false,
  ai_assisted boolean not null default false,
  -- The contributor must confirm they may share the document.
  rights_declared boolean not null check (rights_declared),
  uploader_id uuid references auth.users (id) on delete set null,
  duplicate_of uuid references public.resources (id) on delete set null,
  moderation_note text,
  search_text text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((year_unknown and academic_year is null) or not year_unknown)
);
create index resources_course_idx on public.resources (course_id);
create index resources_university_idx on public.resources (university_id);
create index resources_status_idx on public.resources (status);
create index resources_uploader_idx on public.resources (uploader_id);

create trigger resources_set_updated_at before update on public.resources
  for each row execute function public.set_updated_at();

create function public.resources_before_write() returns trigger
language plpgsql set search_path = public as $$
begin
  -- The course must belong to the same university as the resource.
  if not exists (select 1 from public.courses c where c.id = new.course_id and c.university_id = new.university_id) then
    raise exception 'course does not belong to this university' using errcode = '23514';
  end if;
  new.search_text := lower(public.f_unaccent(coalesce(new.title, '') || ' ' || coalesce(new.description, '')));
  return new;
end $$;

create trigger resources_before_write before insert or update on public.resources
  for each row execute function public.resources_before_write();

-- File metadata is separate from resource metadata, so storage can change later.
create table public.resource_files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  page_count integer check (page_count > 0),
  processing_status text not null default 'pending' check (processing_status in ('pending', 'ready', 'failed')),
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);
create index resource_files_resource_idx on public.resource_files (resource_id);
create index resource_files_sha256_idx on public.resource_files (sha256);
create unique index resource_files_one_current on public.resource_files (resource_id) where is_current;

-- correction_of: resource_id is the correction, related_id is the paper it corrects.
create table public.resource_relations (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  related_id uuid not null references public.resources (id) on delete cascade,
  relation_type text not null check (relation_type in ('correction_of', 'supersedes', 'duplicate_of')),
  check (resource_id <> related_id),
  unique (resource_id, related_id, relation_type)
);
create index resource_relations_related_idx on public.resource_relations (related_id);

create table public.saved_resources (
  user_id uuid not null references auth.users (id) on delete cascade,
  resource_id uuid not null references public.resources (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources (id) on delete cascade,
  reporter_id uuid references auth.users (id) on delete set null,
  reason text not null check (reason in ('wrong_metadata', 'unreadable', 'duplicate', 'wrong_correction', 'unauthorized_content', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index reports_status_idx on public.reports (status);

-- A contributor proposes a missing course or program instead of misfiling a document.
create table public.catalog_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  university_id uuid references public.universities (id) on delete cascade,
  kind text not null check (kind in ('course', 'program', 'unit')),
  payload jsonb not null check (pg_column_size(payload) < 4096),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

-- "I could not find this": a signal for what content to collect next.
create table public.resource_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  university_id uuid references public.universities (id) on delete cascade,
  course_id uuid references public.courses (id) on delete cascade,
  query text check (char_length(query) <= 200),
  created_at timestamptz not null default now()
);

-- Append-only. Written only by the functions below.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  name text not null check (char_length(name) <= 64),
  props jsonb not null default '{}' check (pg_column_size(props) < 4096),
  app_version text check (char_length(app_version) <= 32),
  created_at timestamptz not null default now()
);
create index analytics_events_name_idx on public.analytics_events (name, created_at);

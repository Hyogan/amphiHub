-- amphiHub M1, step 1: extensions, enums and small helpers.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create type public.app_role as enum ('student', 'moderator', 'admin');
create type public.resource_status as enum ('submitted', 'in_review', 'published', 'rejected', 'restricted', 'removed');
create type public.source_type as enum ('community_upload', 'official_source', 'other');
create type public.source_status as enum ('unverified', 'confirmed', 'official_confirmed');

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- unaccent is STABLE, so it cannot be used in an index. This wrapper is declared IMMUTABLE,
-- which is safe as long as the unaccent dictionary is never changed.
create function public.f_unaccent(text) returns text
language sql immutable parallel safe strict as $$
  select extensions.unaccent($1)
$$;

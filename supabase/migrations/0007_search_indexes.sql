-- Trigram indexes so search stays fast as the catalogue grows.
create index resources_search_trgm on public.resources using gin (search_text extensions.gin_trgm_ops);
create index courses_name_trgm on public.courses using gin ((public.f_unaccent(lower(name))) extensions.gin_trgm_ops);
create index course_aliases_trgm on public.course_aliases using gin ((public.f_unaccent(lower(alias))) extensions.gin_trgm_ops);

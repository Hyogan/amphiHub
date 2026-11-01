-- Who may read a stored file. Runs with owner rights, so it does not depend on the caller's
-- column grants (storage_path is hidden from the app). Same rule as 0008: the owner, moderators,
-- or any signed-in user once the resource is published and its file is ready.
create or replace function public.can_read_storage_object(p_name text)
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and (
      p_name like 'incoming/' || auth.uid()::text || '/%'
      or public.is_moderator()
      or exists (
        select 1
        from public.resource_files f
        join public.resources r on r.id = f.resource_id
        where f.storage_path = p_name
          and f.processing_status = 'ready'
          and r.status = 'published'
      )
    );
$$;
revoke all on function public.can_read_storage_object(text) from public, anon;
grant execute on function public.can_read_storage_object(text) to authenticated;

drop policy if exists resources_read on storage.objects;
create policy resources_read on storage.objects for select to authenticated
  using (bucket_id = 'resources' and public.can_read_storage_object(name));

-- What the app needs to download one document: path, size and hash of the current ready file.
-- Empty for guests, and for anything not published.
create or replace function public.resource_file_for_download(p_resource uuid)
returns table (file_id uuid, storage_path text, size_bytes bigint, sha256 text, page_count integer)
language sql stable security definer set search_path = public as $$
  select f.id, f.storage_path, f.size_bytes, f.sha256, f.page_count
  from public.resource_files f
  join public.resources r on r.id = f.resource_id
  where f.resource_id = p_resource
    and f.is_current
    and f.processing_status = 'ready'
    and r.status = 'published'
    and auth.uid() is not null;
$$;
revoke all on function public.resource_file_for_download(uuid) from public, anon;
grant execute on function public.resource_file_for_download(uuid) to authenticated;
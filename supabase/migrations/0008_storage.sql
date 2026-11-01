-- One private bucket for PDFs. Path: incoming/<user id>/<file id>.pdf, and it never changes after upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resources', 'resources', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

-- A signed-in user can upload only into their own folder.
create policy resources_upload on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = 'incoming'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Reading: the owner, moderators, or any signed-in user once the resource is published.
-- Guests cannot read files. A restricted or removed resource loses access immediately.
create policy resources_read on storage.objects for select to authenticated
  using (
    bucket_id = 'resources'
    and (
      ((storage.foldername(name))[1] = 'incoming' and (storage.foldername(name))[2] = auth.uid()::text)
      or public.is_moderator()
      or exists (
        select 1 from public.resource_files f
        join public.resources r on r.id = f.resource_id
        where f.storage_path = storage.objects.name and f.processing_status = 'ready' and r.status = 'published'
      )
    )
  );

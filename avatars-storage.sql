-- PIP avatar storage setup
-- Run once in Supabase > SQL Editor. Creates a public bucket for profile photos
-- while allowing each signed-in member to upload/update/delete only files in their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/gif'];

drop policy if exists "PIP avatars are publicly viewable" on storage.objects;
create policy "PIP avatars are publicly viewable"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Members upload own PIP avatar" on storage.objects;
create policy "Members upload own PIP avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members update own PIP avatar" on storage.objects;
create policy "Members update own PIP avatar"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Members delete own PIP avatar" on storage.objects;
create policy "Members delete own PIP avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

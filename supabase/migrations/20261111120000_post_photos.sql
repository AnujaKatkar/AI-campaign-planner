/*
# Photos on posts

1. Modified Tables
- calendar_items: new `media` column, an ordered list of the post's photos as JSON
  ([{ "path": "<user id>/<campaign id>/<file>.jpg" }, ...]). The first photo is the cover;
  a carousel uses them in order. Existing posts start with an empty list.

2. Storage
- New private bucket `post-media` for post photos (JPEG, PNG or WebP, up to 10 MB each).
- Files live under a folder named after the owner's user id. The app shows them through
  short-lived signed links, so nothing in the bucket is public.

3. Security
- Signed-in users can read, add, replace and delete only files inside their own folder.
- Anonymous visitors get no access.

4. Notes
- Safe to re-run: the column, bucket and policies are created with IF NOT EXISTS / ON CONFLICT or dropped first.
*/

alter table public.calendar_items
  add column if not exists media jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "post_media_owner_select" on storage.objects;
create policy "post_media_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "post_media_owner_insert" on storage.objects;
create policy "post_media_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "post_media_owner_update" on storage.objects;
create policy "post_media_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "post_media_owner_delete" on storage.objects;
create policy "post_media_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

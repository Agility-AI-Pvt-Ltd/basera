-- Allow community feed (and neighbors) to load other users' profile photos.
-- Keys are stored as `{userId}/profile/...` in the private pet-media bucket.
create policy "authenticated read profile photos"
  on storage.objects for select
  using (
    bucket_id = 'pet-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = 'profile'
  );

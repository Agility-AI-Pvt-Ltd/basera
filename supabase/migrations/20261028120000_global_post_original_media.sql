-- Full-resolution media for web feed; mobile feed keeps cropped media_storage_key.

alter table public.global_posts
  add column if not exists original_media_storage_key text;

comment on column public.global_posts.original_media_storage_key is
  'Uncropped source image when media_storage_key is a mobile crop (e.g. 9:16).';

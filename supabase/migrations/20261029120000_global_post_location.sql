-- Tagged map location on community posts

alter table public.global_posts
  add column if not exists location_name text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

alter table public.global_posts drop constraint if exists global_posts_location_coords_check;
alter table public.global_posts
  add constraint global_posts_location_coords_check check (
    (location_lat is null and location_lng is null)
    or (
      location_lat is not null
      and location_lng is not null
      and location_lat between -90 and 90
      and location_lng between -180 and 180
    )
  );

comment on column public.global_posts.location_name is
  'Human-readable place label for a tagged map location.';
comment on column public.global_posts.location_lat is
  'Latitude for tagged location (opens in Google Maps).';
comment on column public.global_posts.location_lng is
  'Longitude for tagged location (opens in Google Maps).';

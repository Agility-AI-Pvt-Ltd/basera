-- Reports / flags on global community posts, visible to app admins.

create table public.global_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.global_posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index global_post_reports_created_idx on public.global_post_reports (created_at desc);
create index global_post_reports_status_idx on public.global_post_reports (status, created_at desc);

alter table public.global_post_reports enable row level security;

create policy "reporters insert own post reports"
  on public.global_post_reports for insert
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.global_posts p
      where p.id = post_id
        and p.author_id <> auth.uid()
    )
  );

create policy "reporters read own post reports"
  on public.global_post_reports for select
  using (auth.uid() = reporter_id);

create policy "admins manage all global post reports"
  on public.global_post_reports for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all global posts"
  on public.global_posts for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all global post comments"
  on public.global_post_comments for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all global post likes"
  on public.global_post_likes for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]
where id = 'community-media';

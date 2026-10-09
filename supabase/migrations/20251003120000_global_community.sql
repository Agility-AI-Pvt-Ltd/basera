-- Basera Global Community (single feed, realtime)

create table public.global_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  post_type text not null default 'text' check (
    post_type in ('text', 'photo', 'video', 'question', 'tip', 'adoption_story', 'pet_update')
  ),
  pet_name text,
  media_storage_key text,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index global_posts_created_idx on public.global_posts (created_at desc);
create index global_posts_author_idx on public.global_posts (author_id);

create table public.global_post_likes (
  post_id uuid not null references public.global_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.global_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.global_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.global_post_comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index global_post_comments_post_idx on public.global_post_comments (post_id, created_at);

create table public.global_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create or replace function public.global_posts_refresh_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.global_posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.global_posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger global_post_likes_count
  after insert or delete on public.global_post_likes
  for each row
  execute function public.global_posts_refresh_like_count();

create or replace function public.global_posts_refresh_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.global_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.global_posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger global_post_comments_count
  after insert or delete on public.global_post_comments
  for each row
  execute function public.global_posts_refresh_comment_count();

alter table public.global_posts enable row level security;
alter table public.global_post_likes enable row level security;
alter table public.global_post_comments enable row level security;
alter table public.global_follows enable row level security;

create policy "read global posts"
  on public.global_posts for select
  using (true);

create policy "authors insert global posts"
  on public.global_posts for insert
  with check (auth.uid() = author_id);

create policy "authors update own global posts"
  on public.global_posts for update
  using (auth.uid() = author_id);

create policy "authors delete own global posts"
  on public.global_posts for delete
  using (auth.uid() = author_id);

create policy "read global post likes"
  on public.global_post_likes for select
  using (true);

create policy "users manage own likes"
  on public.global_post_likes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "read global post comments"
  on public.global_post_comments for select
  using (true);

create policy "users insert comments"
  on public.global_post_comments for insert
  with check (auth.uid() = author_id);

create policy "authors delete own comments"
  on public.global_post_comments for delete
  using (auth.uid() = author_id);

create policy "read follows"
  on public.global_follows for select
  using (true);

create policy "users manage own follows"
  on public.global_follows for all
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

alter publication supabase_realtime add table public.global_posts;
alter publication supabase_realtime add table public.global_post_comments;
alter publication supabase_realtime add table public.global_post_likes;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-media',
  'community-media',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do nothing;

create policy "public read community media"
  on storage.objects for select
  using (bucket_id = 'community-media');

create policy "auth upload community media"
  on storage.objects for insert
  with check (
    bucket_id = 'community-media'
    and auth.role() = 'authenticated'
  );

create policy "owners update community media"
  on storage.objects for update
  using (bucket_id = 'community-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "owners delete community media"
  on storage.objects for delete
  using (bucket_id = 'community-media' and auth.uid()::text = (storage.foldername(name))[1]);

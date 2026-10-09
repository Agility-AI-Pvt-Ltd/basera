-- Fix PostgREST relationship: author_id -> profiles (same uuid as auth.users)
alter table public.global_posts
  drop constraint if exists global_posts_author_id_fkey;

alter table public.global_posts
  add constraint global_posts_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;

alter table public.global_post_comments
  drop constraint if exists global_post_comments_author_id_fkey;

alter table public.global_post_comments
  add constraint global_post_comments_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete cascade;

-- Allow feed to resolve author display names (minimal exposure: name + photo only via select columns in app)
create policy "global feed read author profiles"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or id in (select author_id from public.global_posts)
    or id in (select author_id from public.global_post_comments)
  );

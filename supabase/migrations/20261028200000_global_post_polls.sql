-- Poll posts for global community (web + mobile)

alter table public.global_posts
  add column if not exists poll_title text,
  add column if not exists poll_ends_at timestamptz;

alter table public.global_posts drop constraint if exists global_posts_post_type_check;

alter table public.global_posts
  add constraint global_posts_post_type_check check (
    post_type in (
      'text',
      'photo',
      'video',
      'question',
      'tip',
      'adoption_story',
      'pet_update',
      'poll'
    )
  );

create table if not exists public.global_post_poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.global_posts (id) on delete cascade,
  label text not null,
  position int not null default 0,
  constraint global_post_poll_options_label_len check (char_length(trim(label)) >= 1)
);

create index if not exists global_post_poll_options_post_idx
  on public.global_post_poll_options (post_id, position);

create table if not exists public.global_post_poll_votes (
  post_id uuid not null references public.global_posts (id) on delete cascade,
  option_id uuid not null references public.global_post_poll_options (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists global_post_poll_votes_option_idx
  on public.global_post_poll_votes (option_id);

alter table public.global_post_poll_options enable row level security;
alter table public.global_post_poll_votes enable row level security;

create policy "read global post poll options"
  on public.global_post_poll_options for select
  using (true);

create policy "authors insert poll options"
  on public.global_post_poll_options for insert
  with check (
    exists (
      select 1
      from public.global_posts p
      where p.id = post_id and p.author_id = auth.uid()
    )
  );

create policy "read global post poll votes"
  on public.global_post_poll_votes for select
  using (true);

create policy "users manage own poll votes"
  on public.global_post_poll_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on table public.global_post_poll_options to anon, authenticated;
grant insert on table public.global_post_poll_options to authenticated;

grant select on table public.global_post_poll_votes to anon, authenticated;
grant insert, update, delete on table public.global_post_poll_votes to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.global_post_poll_votes;
exception
  when duplicate_object then null;
end $$;

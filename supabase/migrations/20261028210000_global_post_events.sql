-- Community event posts + RSVPs

alter table public.global_posts
  add column if not exists event_title text,
  add column if not exists event_starts_at timestamptz,
  add column if not exists event_location text,
  add column if not exists event_visibility text;

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
      'poll',
      'event'
    )
  );

alter table public.global_posts drop constraint if exists global_posts_event_visibility_check;
alter table public.global_posts
  add constraint global_posts_event_visibility_check check (
    event_visibility is null
    or event_visibility in ('open', 'invite_only')
  );

create table if not exists public.global_post_event_rsvps (
  post_id uuid not null references public.global_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists global_post_event_rsvps_post_idx
  on public.global_post_event_rsvps (post_id, status);

alter table public.global_post_event_rsvps enable row level security;

drop policy if exists "read global post event rsvps" on public.global_post_event_rsvps;
create policy "read global post event rsvps"
  on public.global_post_event_rsvps for select
  using (true);

drop policy if exists "users manage own event rsvps" on public.global_post_event_rsvps;
create policy "users manage own event rsvps"
  on public.global_post_event_rsvps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select on table public.global_post_event_rsvps to anon, authenticated;
grant insert, update, delete on table public.global_post_event_rsvps to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.global_post_event_rsvps;
exception
  when duplicate_object then null;
end $$;

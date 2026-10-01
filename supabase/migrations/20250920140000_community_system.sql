-- Community: packs, meetups, neighbors (location-based discovery)

alter table public.profiles
  add column if not exists neighbor_discoverability text not null default 'area'
    check (neighbor_discoverability in ('nobody', 'area', 'pack_members', 'everyone')),
  add column if not exists show_distance boolean not null default true,
  add column if not exists show_pet_to_neighbors boolean not null default true;

create table public.community_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  cover_storage_key text,
  category text not null default 'location' check (
    category in ('location', 'breed', 'activity', 'training', 'rescue', 'species', 'interest', 'pet_parents', 'other')
  ),
  city text not null default '',
  area text not null default '',
  state text not null default '',
  latitude double precision,
  longitude double precision,
  radius_km int not null default 5,
  privacy text not null default 'public' check (privacy in ('public', 'approval', 'invite_only')),
  rules text[] not null default '{}',
  member_count int not null default 1,
  created_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index community_packs_city_idx on public.community_packs (city);
create index community_packs_geo_idx on public.community_packs (latitude, longitude);

alter table public.community_packs enable row level security;

create policy "read active community packs"
  on public.community_packs for select
  using (status = 'active' or created_by = auth.uid());

create policy "creators manage community packs"
  on public.community_packs for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create trigger community_packs_updated_at
  before update on public.community_packs
  for each row
  execute function public.set_updated_at();

create table public.pack_members (
  pack_id uuid not null references public.community_packs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'moderator', 'member')),
  status text not null default 'active' check (status in ('pending', 'active', 'muted', 'banned', 'left')),
  joined_at timestamptz not null default now(),
  primary key (pack_id, user_id)
);

alter table public.pack_members enable row level security;

create policy "read pack members for visible packs"
  on public.pack_members for select
  using (
    pack_id in (select id from public.community_packs where status = 'active' or created_by = auth.uid())
    or user_id = auth.uid()
  );

create policy "users join and update own membership"
  on public.pack_members for insert
  with check (user_id = auth.uid());

create policy "users update own membership"
  on public.pack_members for update
  using (user_id = auth.uid() or pack_id in (select id from public.community_packs where created_by = auth.uid()));

create table public.pack_posts (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.community_packs (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index pack_posts_pack_id_idx on public.pack_posts (pack_id, created_at desc);

alter table public.pack_posts enable row level security;

create policy "read posts in visible packs"
  on public.pack_posts for select
  using (
    pack_id in (select id from public.community_packs where status = 'active' or created_by = auth.uid())
  );

create policy "members post in joined packs"
  on public.pack_posts for insert
  with check (
    author_id = auth.uid()
    and pack_id in (
      select pack_id from public.pack_members
      where user_id = auth.uid() and status = 'active'
    )
  );

create table public.community_meetups (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references public.community_packs (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  meetup_type text not null default 'dog_walk' check (
    meetup_type in ('dog_walk', 'playdate', 'training', 'pet_meetup', 'adoption_event', 'community', 'other')
  ),
  description text not null default '',
  start_at timestamptz not null,
  end_at timestamptz,
  location_name text not null default '',
  city text not null default '',
  area text not null default '',
  latitude double precision,
  longitude double precision,
  max_attendees int,
  privacy text not null default 'public' check (privacy in ('public', 'pack_members', 'approval')),
  status text not null default 'upcoming' check (status in ('upcoming', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index community_meetups_start_idx on public.community_meetups (start_at);

alter table public.community_meetups enable row level security;

create policy "read upcoming meetups"
  on public.community_meetups for select
  using (status = 'upcoming' or created_by = auth.uid());

create policy "creators manage meetups"
  on public.community_meetups for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create table public.meetup_attendees (
  meetup_id uuid not null references public.community_meetups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'interested')),
  joined_at timestamptz not null default now(),
  primary key (meetup_id, user_id)
);

alter table public.meetup_attendees enable row level security;

create policy "read meetup attendees"
  on public.meetup_attendees for select
  using (true);

create policy "users manage own attendance"
  on public.meetup_attendees for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.community_connections (
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  primary key (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);

alter table public.community_connections enable row level security;

create policy "participants read connections"
  on public.community_connections for select
  using (requester_id = auth.uid() or recipient_id = auth.uid());

create policy "users create connection requests"
  on public.community_connections for insert
  with check (requester_id = auth.uid());

create policy "recipients update connection status"
  on public.community_connections for update
  using (recipient_id = auth.uid() or requester_id = auth.uid());

-- Discoverable profiles for neighbors (limited exposure — no exact coords in API layer)
create policy "community discoverable profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or (
      signup_complete = true
      and neighbor_discoverability in ('area', 'everyone')
      and locality_lat is not null
      and locality_lng is not null
    )
  );

create policy "read pets of discoverable neighbors"
  on public.pets for select
  using (
    owner_id = auth.uid()
    or owner_id in (
      select id from public.profiles
      where signup_complete = true
        and show_pet_to_neighbors = true
        and neighbor_discoverability in ('area', 'everyone')
    )
  );

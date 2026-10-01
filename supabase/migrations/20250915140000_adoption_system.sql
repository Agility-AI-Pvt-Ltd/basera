-- Adoption: listings (supply) + applications (demand) + conversations + handoff

create table public.adoption_listings (
  id uuid primary key default gen_random_uuid(),
  listed_by uuid not null references auth.users (id) on delete cascade,
  pet_id uuid references public.pets (id) on delete set null,
  source_type text not null check (
    source_type in ('owned', 'stray', 'rescued', 'foster', 'organization')
  ),
  status text not null default 'draft' check (
    status in ('draft', 'pending_verification', 'active', 'paused', 'adopted', 'removed')
  ),
  title text not null default '',
  description text not null default '',
  pet_name text not null,
  species text not null default 'dog' check (species in ('dog', 'cat', 'bird', 'fish', 'other')),
  breed text not null default '',
  age_label text not null default '',
  gender text check (gender in ('male', 'female', 'unknown')),
  size text check (size in ('small', 'medium', 'large', 'unknown')),
  color text not null default '',
  weight_kg numeric(6, 2),
  sterilized boolean,
  good_with_children boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  energy_level text check (energy_level in ('very_high', 'high', 'moderate', 'low')),
  temperament_tags text[] not null default '{}',
  health_status text check (
    health_status in ('healthy', 'recovering', 'ongoing_condition', 'needs_attention')
  ),
  vaccination_tags text[] not null default '{}',
  stray_info jsonb not null default '{}',
  adoption_requirements jsonb not null default '{}',
  adoption_preferences jsonb not null default '{}',
  city text not null default '',
  state text not null default '',
  country text not null default 'India',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  public_location_label text not null default '',
  adoption_radius text not null default 'same_city',
  verification_status text not null default 'none' check (
    verification_status in ('none', 'pending', 'verified', 'rejected')
  ),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index adoption_listings_status_idx on public.adoption_listings (status);
create index adoption_listings_listed_by_idx on public.adoption_listings (listed_by);
create index adoption_listings_city_idx on public.adoption_listings (city);

alter table public.adoption_listings enable row level security;

create policy "public read active adoption listings"
  on public.adoption_listings for select
  using (status = 'active' or listed_by = auth.uid());

create policy "owners manage own adoption listings"
  on public.adoption_listings for all
  using (listed_by = auth.uid())
  with check (listed_by = auth.uid());

create trigger adoption_listings_updated_at
  before update on public.adoption_listings
  for each row
  execute function public.set_updated_at();

create table public.adoption_listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_key text not null,
  sort_order int not null default 0,
  category text,
  created_at timestamptz not null default now()
);

alter table public.adoption_listing_media enable row level security;

create policy "read media for visible listings"
  on public.adoption_listing_media for select
  using (
    listing_id in (
      select id from public.adoption_listings
      where status = 'active' or listed_by = auth.uid()
    )
  );

create policy "owners manage listing media"
  on public.adoption_listing_media for all
  using (
    listing_id in (select id from public.adoption_listings where listed_by = auth.uid())
  )
  with check (
    listing_id in (select id from public.adoption_listings where listed_by = auth.uid())
  );

create table public.adoption_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (
    status in (
      'pending',
      'under_review',
      'contacted',
      'meet_and_greet',
      'home_check',
      'approved',
      'adoption_scheduled',
      'completed',
      'rejected',
      'withdrawn',
      'cancelled'
    )
  ),
  applicant_profile jsonb not null default '{}',
  home jsonb not null default '{}',
  household jsonb not null default '{}',
  existing_pets jsonb not null default '[]',
  experience jsonb not null default '{}',
  availability jsonb not null default '{}',
  financial jsonb not null default '{}',
  answers jsonb not null default '{}',
  compatibility_score int,
  compatibility_insights jsonb not null default '[]',
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (listing_id, applicant_id)
);

create index adoption_applications_listing_idx on public.adoption_applications (listing_id);
create index adoption_applications_applicant_idx on public.adoption_applications (applicant_id);

alter table public.adoption_applications enable row level security;

create policy "applicant and lister read applications"
  on public.adoption_applications for select
  using (
    applicant_id = auth.uid()
    or listing_id in (select id from public.adoption_listings where listed_by = auth.uid())
  );

create policy "applicants insert own applications"
  on public.adoption_applications for insert
  with check (applicant_id = auth.uid());

create policy "applicant and lister update applications"
  on public.adoption_applications for update
  using (
    applicant_id = auth.uid()
    or listing_id in (select id from public.adoption_listings where listed_by = auth.uid())
  );

create trigger adoption_applications_updated_at
  before update on public.adoption_applications
  for each row
  execute function public.set_updated_at();

create table public.adoption_conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  application_id uuid not null unique references public.adoption_applications (id) on delete cascade,
  lister_id uuid not null references auth.users (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.adoption_conversations enable row level security;

create policy "participants read conversations"
  on public.adoption_conversations for select
  using (lister_id = auth.uid() or applicant_id = auth.uid());

create policy "participants insert conversations"
  on public.adoption_conversations for insert
  with check (lister_id = auth.uid() or applicant_id = auth.uid());

create table public.adoption_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.adoption_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index adoption_messages_conversation_idx on public.adoption_messages (conversation_id, created_at);

alter table public.adoption_messages enable row level security;

create policy "participants read messages"
  on public.adoption_messages for select
  using (
    conversation_id in (
      select id from public.adoption_conversations
      where lister_id = auth.uid() or applicant_id = auth.uid()
    )
  );

create policy "participants send messages"
  on public.adoption_messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select id from public.adoption_conversations
      where lister_id = auth.uid() or applicant_id = auth.uid()
    )
  );

create table public.adoption_meetings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.adoption_applications (id) on delete cascade,
  scheduled_at timestamptz not null,
  location_notes text not null default '',
  status text not null default 'scheduled' check (
    status in ('scheduled', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

alter table public.adoption_meetings enable row level security;

create policy "participants manage meetings"
  on public.adoption_meetings for all
  using (
    application_id in (
      select a.id from public.adoption_applications a
      join public.adoption_listings l on l.id = a.listing_id
      where a.applicant_id = auth.uid() or l.listed_by = auth.uid()
    )
  )
  with check (
    application_id in (
      select a.id from public.adoption_applications a
      join public.adoption_listings l on l.id = a.listing_id
      where a.applicant_id = auth.uid() or l.listed_by = auth.uid()
    )
  );

create table public.adoption_records (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.adoption_listings (id) on delete cascade,
  application_id uuid not null unique references public.adoption_applications (id) on delete cascade,
  adoption_date date,
  lister_confirmed boolean not null default false,
  adopter_confirmed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.adoption_records enable row level security;

create policy "participants read adoption records"
  on public.adoption_records for select
  using (
    application_id in (
      select a.id from public.adoption_applications a
      join public.adoption_listings l on l.id = a.listing_id
      where a.applicant_id = auth.uid() or l.listed_by = auth.uid()
    )
  );

create policy "participants update adoption records"
  on public.adoption_records for update
  using (
    application_id in (
      select a.id from public.adoption_applications a
      join public.adoption_listings l on l.id = a.listing_id
      where a.applicant_id = auth.uid() or l.listed_by = auth.uid()
    )
  );

create table public.adoption_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  listing_id uuid references public.adoption_listings (id) on delete set null,
  reported_user_id uuid references auth.users (id) on delete set null,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.adoption_reports enable row level security;

create policy "users insert adoption reports"
  on public.adoption_reports for insert
  with check (reporter_id = auth.uid());

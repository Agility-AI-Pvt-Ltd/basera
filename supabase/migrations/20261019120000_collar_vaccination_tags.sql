-- Collar Vaccination & Community Tag System
-- Tracks street/community animals vaccinated during drives, linked to physical QR collars.

create table if not exists public.community_animals (
  id uuid primary key default gen_random_uuid(),
  tag_code text not null unique,
  name text not null default 'Community Animal',
  species text not null default 'dog' check (species in ('dog', 'cat', 'other')),
  gender text check (gender in ('male', 'female', 'unknown')),
  photo_url text,
  territory text not null default '',
  city text not null default '',
  is_sterilized boolean not null default false,
  ear_notched boolean not null default false,
  caregiver_contact text,
  status text not null default 'unassigned' check (
    status in ('unassigned', 'active', 'treatment', 'missing', 'adopted', 'deceased')
  ),
  last_seen_location text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- In case table already existed from earlier run, add new columns if missing
alter table public.community_animals
  add column if not exists last_seen_location text,
  add column if not exists last_seen_at timestamptz;

-- Update status check constraint if table already existed
alter table public.community_animals drop constraint if exists community_animals_status_check;
alter table public.community_animals add constraint community_animals_status_check
  check (status in ('unassigned', 'active', 'treatment', 'missing', 'adopted', 'deceased'));

create unique index if not exists community_animals_tag_code_upper_idx
  on public.community_animals (upper(tag_code));

create table if not exists public.community_animal_vaccinations (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.community_animals (id) on delete cascade,
  vaccine_name text not null,
  administered_date date not null default current_date,
  valid_until date not null,
  batch_number text,
  drive_name text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists animal_vaccinations_animal_idx
  on public.community_animal_vaccinations (animal_id, administered_date desc);

create table if not exists public.community_animal_logs (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.community_animals (id) on delete cascade,
  log_type text not null check (log_type in ('feeding', 'sighting', 'health_alert', 'note')),
  body text not null check (char_length(body) >= 2 and char_length(body) <= 500),
  reporter_name text,
  location_detail text,
  created_at timestamptz not null default now()
);

create index if not exists animal_logs_animal_idx
  on public.community_animal_logs (animal_id, created_at desc);

-- Automatic trigger: update animal's last_seen_at and last_seen_location on new log
create or replace function public.on_animal_log_added()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.community_animals
  set
    last_seen_at = new.created_at,
    last_seen_location = coalesce(nullif(new.location_detail, ''), last_seen_location),
    updated_at = now()
  where id = new.animal_id;
  return new;
end;
$$;

drop trigger if exists trg_animal_log_added on public.community_animal_logs;
create trigger trg_animal_log_added
  after insert on public.community_animal_logs
  for each row
  execute function public.on_animal_log_added();

-- RLS
alter table public.community_animals enable row level security;
alter table public.community_animal_vaccinations enable row level security;
alter table public.community_animal_logs enable row level security;

-- Public read access so anyone scanning collar tag can immediately view safety and vaccine data
drop policy if exists "public read community animals" on public.community_animals;
create policy "public read community animals"
  on public.community_animals for select
  using (true);

drop policy if exists "public read community animal vaccinations" on public.community_animal_vaccinations;
create policy "public read community animal vaccinations"
  on public.community_animal_vaccinations for select
  using (true);

drop policy if exists "public read community animal logs" on public.community_animal_logs;
create policy "public read community animal logs"
  on public.community_animal_logs for select
  using (true);

-- Public insert on community logs (sightings, feeding confirmations, health alerts)
drop policy if exists "public insert community animal logs" on public.community_animal_logs;
create policy "public insert community animal logs"
  on public.community_animal_logs for insert
  with check (char_length(body) >= 2 and char_length(body) <= 500);

-- Option A: field volunteer can pair an unassigned tag
drop policy if exists "public pair unassigned animal" on public.community_animals;
create policy "public pair unassigned animal"
  on public.community_animals for update
  using (status = 'unassigned')
  with check (true);

-- Public insert initial vaccination during field drive
drop policy if exists "public insert vaccinations" on public.community_animal_vaccinations;
create policy "public insert vaccinations"
  on public.community_animal_vaccinations for insert
  with check (true);

-- Manage animals: authenticated / admins
drop policy if exists "authenticated insert community animals" on public.community_animals;
create policy "authenticated insert community animals"
  on public.community_animals for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated update community animals" on public.community_animals;
create policy "authenticated update community animals"
  on public.community_animals for update
  to authenticated
  using (true);

drop policy if exists "authenticated delete community animals" on public.community_animals;
create policy "authenticated delete community animals"
  on public.community_animals for delete
  to authenticated
  using (true);

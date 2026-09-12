-- Pets owned by accounts (one owner → many pets)
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  breed text not null default '',
  species text not null default 'dog' check (species in ('dog', 'cat', 'bird', 'fish', 'other')),
  gender text check (gender in ('male', 'female', 'unknown')),
  birth_date date,
  weight_kg numeric(6, 2),
  photo_storage_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pets_owner_id_idx on public.pets (owner_id);

alter table public.pets enable row level security;

create policy "owners read own pets"
  on public.pets for select
  using (owner_id = auth.uid());

create policy "owners insert own pets"
  on public.pets for insert
  with check (owner_id = auth.uid());

create policy "owners update own pets"
  on public.pets for update
  using (owner_id = auth.uid());

create policy "owners delete own pets"
  on public.pets for delete
  using (owner_id = auth.uid());

create trigger pets_updated_at
  before update on public.pets
  for each row
  execute function public.set_updated_at();

-- Vaccination certs and other files (one row per document)
create table public.pet_documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  doc_type text not null check (
    doc_type in (
      'vaccination_rabies',
      'vaccination_dhpp',
      'vaccination_lepto',
      'sterilisation',
      'other'
    )
  ),
  storage_key text not null,
  issued_date date,
  expiry_date date,
  verified boolean not null default false,
  uploaded_at timestamptz not null default now()
);

create index pet_documents_pet_id_idx on public.pet_documents (pet_id);

alter table public.pet_documents enable row level security;

create policy "owners manage own pet documents"
  on public.pet_documents
  for all
  using (
    pet_id in (select id from public.pets where owner_id = auth.uid())
  )
  with check (
    pet_id in (select id from public.pets where owner_id = auth.uid())
  );

-- Care diary tables (one table per concern — not crammed onto pets)
create table public.pet_health_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  category text not null check (
    category in ('vet_visit', 'grooming', 'medicine', 'vaccination')
  ),
  title text not null,
  subtitle text not null default '',
  event_date date not null default current_date,
  completed boolean not null default false,
  notes text,
  provider_name text,
  created_at timestamptz not null default now()
);

create table public.pet_training_sessions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null,
  duration_minutes int not null default 10,
  approaches int not null default 1,
  session_date date not null default current_date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.pet_activity_days (
  pet_id uuid not null references public.pets (id) on delete cascade,
  activity_date date not null,
  level text not null check (level in ('very_high', 'high', 'moderate', 'low')),
  primary key (pet_id, activity_date)
);

create table public.pet_meals (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  meal_date date not null default current_date,
  slot text not null check (slot in ('morning', 'afternoon', 'evening', 'treat')),
  description text not null,
  amount_grams int,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.pet_nutrition_days (
  pet_id uuid not null references public.pets (id) on delete cascade,
  nutrition_date date not null default current_date,
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fat_g int not null default 0,
  primary key (pet_id, nutrition_date)
);

alter table public.pet_health_events enable row level security;
alter table public.pet_training_sessions enable row level security;
alter table public.pet_activity_days enable row level security;
alter table public.pet_meals enable row level security;
alter table public.pet_nutrition_days enable row level security;

create policy "owners manage pet health events"
  on public.pet_health_events for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create policy "owners manage pet training sessions"
  on public.pet_training_sessions for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create policy "owners manage pet activity days"
  on public.pet_activity_days for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create policy "owners manage pet meals"
  on public.pet_meals for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create policy "owners manage pet nutrition days"
  on public.pet_nutrition_days for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- Storage bucket for pet photos and document scans
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-media',
  'pet-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

create policy "owners read own pet media"
  on storage.objects for select
  using (
    bucket_id = 'pet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners upload own pet media"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update own pet media"
  on storage.objects for update
  using (
    bucket_id = 'pet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete own pet media"
  on storage.objects for delete
  using (
    bucket_id = 'pet-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

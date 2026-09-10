-- User profiles (signup details beyond phone auth)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  name text not null default '',
  is_adult boolean not null default false,
  locality text not null default '',
  city text not null default '',
  locality_lat double precision,
  locality_lng double precision,
  photo_uri text,
  bio text,
  has_dog boolean,
  pet jsonb,
  adoption_setup_done boolean not null default false,
  selected_pack_ids text[] not null default '{}',
  signup_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Empty profile row for every new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Nutrition system: preferences → plan → foods → meals → logs

create table public.pet_nutrition_preferences (
  pet_id uuid primary key references public.pets (id) on delete cascade,
  goal text not null default 'general_health',
  diet_types text[] not null default '{}',
  restrictions text[] not null default '{}',
  allergy_ingredients text[] not null default '{}',
  meals_per_day int not null default 2 check (meals_per_day between 1 and 6),
  feeding_times text[] not null default '{08:00,19:00}',
  treat_frequency text check (treat_frequency in ('low', 'moderate', 'high')),
  portion_measured boolean not null default true,
  typical_portion_grams int,
  water_access text,
  feeding_location text,
  activity_level text check (activity_level in ('very_high', 'high', 'moderate', 'low')),
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.pet_nutrition_preferences enable row level security;

create policy "owners manage pet nutrition preferences"
  on public.pet_nutrition_preferences for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create trigger pet_nutrition_preferences_updated_at
  before update on public.pet_nutrition_preferences
  for each row
  execute function public.set_updated_at();

create table public.pet_nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  is_active boolean not null default true,
  daily_meals int not null default 2,
  main_food_type text,
  treat_limit int not null default 5,
  water_goal_cups numeric(5, 1),
  guidance_notes text,
  created_at timestamptz not null default now()
);

create index pet_nutrition_plans_pet_active_idx
  on public.pet_nutrition_plans (pet_id, is_active);

alter table public.pet_nutrition_plans enable row level security;

create policy "owners manage pet nutrition plans"
  on public.pet_nutrition_plans for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create table public.pet_foods (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  name text not null,
  brand text,
  food_type text not null,
  quantity numeric(8, 1),
  unit text not null default 'grams',
  ingredients jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index pet_foods_pet_id_idx on public.pet_foods (pet_id);

alter table public.pet_foods enable row level security;

create policy "owners manage pet foods"
  on public.pet_foods for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create table public.pet_nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.pet_nutrition_plans (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  scheduled_time text not null,
  food_id uuid references public.pet_foods (id) on delete set null,
  food_name text not null,
  food_type text not null,
  planned_quantity numeric(8, 1),
  unit text not null default 'grams',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index pet_nutrition_meals_pet_date_idx
  on public.pet_nutrition_meals (pet_id, meal_date);

alter table public.pet_nutrition_meals enable row level security;

create policy "owners manage pet nutrition meals"
  on public.pet_nutrition_meals for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create table public.pet_feeding_logs (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.pet_nutrition_meals (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  log_date date not null,
  fed boolean not null default true,
  fed_at timestamptz not null default now(),
  actual_quantity numeric(8, 1),
  unique (meal_id, log_date)
);

create index pet_feeding_logs_pet_date_idx
  on public.pet_feeding_logs (pet_id, log_date);

alter table public.pet_feeding_logs enable row level security;

create policy "owners manage pet feeding logs"
  on public.pet_feeding_logs for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create table public.pet_water_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  log_date date not null,
  cups numeric(4, 1) not null default 1,
  logged_at timestamptz not null default now()
);

create index pet_water_logs_pet_date_idx
  on public.pet_water_logs (pet_id, log_date);

alter table public.pet_water_logs enable row level security;

create policy "owners manage pet water logs"
  on public.pet_water_logs for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

create table public.pet_treat_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  log_date date not null,
  treat_name text not null default 'Treat',
  quantity int not null default 1,
  logged_at timestamptz not null default now()
);

create index pet_treat_logs_pet_date_idx
  on public.pet_treat_logs (pet_id, log_date);

alter table public.pet_treat_logs enable row level security;

create policy "owners manage pet treat logs"
  on public.pet_treat_logs for all
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

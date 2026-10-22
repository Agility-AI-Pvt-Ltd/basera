-- Harden AI nutrition generation: bounds, provenance, rate limiting, and atomic writes.

alter table public.pet_nutrition_plans
  add column if not exists source text not null default 'rule_based',
  add column if not exists model text;

alter table public.pet_nutrition_plans
  add constraint pet_nutrition_plans_source_check
    check (source in ('rule_based', 'ai')),
  add constraint pet_nutrition_plans_daily_meals_check
    check (daily_meals between 1 and 6),
  add constraint pet_nutrition_plans_treat_limit_check
    check (treat_limit between 0 and 10),
  add constraint pet_nutrition_plans_water_goal_check
    check (water_goal_cups is null or water_goal_cups between 0 and 20);

alter table public.pet_nutrition_meals
  add constraint pet_nutrition_meals_quantity_check
    check (planned_quantity is null or planned_quantity between 0 and 10000),
  add constraint pet_nutrition_meals_time_check
    check (scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add constraint pet_nutrition_meals_sort_order_check
    check (sort_order >= 0);

alter table public.pet_nutrition_plans
  add constraint pet_nutrition_plans_id_pet_unique unique (id, pet_id);

alter table public.pet_foods
  add constraint pet_foods_id_pet_unique unique (id, pet_id);

alter table public.pet_nutrition_meals
  add constraint pet_nutrition_meals_plan_pet_fk
    foreign key (plan_id, pet_id)
    references public.pet_nutrition_plans (id, pet_id)
    on delete cascade;

create table public.nutrition_generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index nutrition_generation_log_user_created_idx
  on public.nutrition_generation_log (user_id, created_at desc);

alter table public.nutrition_generation_log enable row level security;

create policy "owners can read their nutrition generation log"
  on public.nutrition_generation_log for select
  using (user_id = auth.uid());

create policy "owners can record their nutrition generation"
  on public.nutrition_generation_log for insert
  with check (user_id = auth.uid());

create or replace function public.replace_nutrition_plan(
  p_pet_id uuid,
  p_plan jsonb,
  p_meals jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_plan_id uuid;
  v_daily_meals int;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.pets
    where id = p_pet_id and owner_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Pet is not owned by the current user';
  end if;

  if jsonb_typeof(p_plan) <> 'object' or jsonb_typeof(p_meals) <> 'array' then
    raise exception using errcode = '22023', message = 'Invalid nutrition plan payload';
  end if;

  v_daily_meals := (p_plan->>'daily_meals')::int;
  if v_daily_meals not between 1 and 6 then
    raise exception using errcode = '22023', message = 'Invalid daily meal count';
  end if;

  if jsonb_array_length(p_meals) <> v_daily_meals * 7 then
    raise exception using errcode = '22023', message = 'A nutrition plan must contain seven days of meals';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_pet_id::text, 0));

  if (
    select count(*) from public.nutrition_generation_log
    where user_id = v_user_id
      and pet_id = p_pet_id
      and created_at >= now() - interval '24 hours'
  ) >= 3 then
    raise exception using errcode = 'P0001', message = 'Nutrition plan generation limit reached';
  end if;

  insert into public.nutrition_generation_log (user_id, pet_id)
  values (v_user_id, p_pet_id);

  update public.pet_nutrition_plans
  set is_active = false
  where pet_id = p_pet_id and is_active = true;

  insert into public.pet_nutrition_plans (
    pet_id, is_active, daily_meals, main_food_type, treat_limit,
    water_goal_cups, guidance_notes, source, model
  )
  values (
    p_pet_id,
    true,
    v_daily_meals,
    p_plan->>'main_food_type',
    (p_plan->>'treat_limit')::int,
    nullif(p_plan->>'water_goal_cups', '')::numeric,
    left(p_plan->>'guidance_notes', 2000),
    coalesce(p_plan->>'source', 'ai'),
    nullif(p_plan->>'model', '')
  )
  returning id into v_plan_id;

  insert into public.pet_nutrition_meals (
    plan_id, pet_id, meal_date, meal_type, scheduled_time,
    food_id, food_name, food_type, planned_quantity, unit, sort_order
  )
  select
    v_plan_id,
    p_pet_id,
    (meal->>'meal_date')::date,
    meal->>'meal_type',
    meal->>'scheduled_time',
    nullif(meal->>'food_id', '')::uuid,
    meal->>'food_name',
    meal->>'food_type',
    nullif(meal->>'planned_quantity', '')::numeric,
    meal->>'unit',
    (meal->>'sort_order')::int
  from jsonb_array_elements(p_meals) as items(meal);

  return v_plan_id;
end;
$$;

revoke execute on function public.replace_nutrition_plan(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.replace_nutrition_plan(uuid, jsonb, jsonb) to authenticated;

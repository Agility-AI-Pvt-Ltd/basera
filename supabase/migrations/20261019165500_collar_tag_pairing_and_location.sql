-- Collar Tag Pairing, Last Location & Community Updates
-- Adds unassigned status for field pairing (Phase 2 Option A) and last_seen tracking.

alter table public.community_animals
  add column if not exists last_seen_location text,
  add column if not exists last_seen_at timestamptz;

alter table public.community_animals drop constraint if exists community_animals_status_check;
alter table public.community_animals add constraint community_animals_status_check
  check (status in ('unassigned', 'active', 'treatment', 'missing', 'adopted', 'deceased'));

-- Automatic trigger: update animal's last_seen_at and last_seen_location on new community log
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

-- Option A: field volunteer can pair an unassigned tag
drop policy if exists "public pair unassigned animal" on public.community_animals;
create policy "public pair unassigned animal"
  on public.community_animals for update
  using (status = 'unassigned')
  with check (true);

-- Allow public insertion of initial vaccination during field drive
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

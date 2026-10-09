-- Admin dashboard: flag on profiles + RLS bypass for app admins

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- Admins can read/update all profiles (including is_admin); users keep existing policies
create policy "admins manage all profiles"
  on public.profiles
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all pets"
  on public.pets for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all pet_documents"
  on public.pet_documents for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all pet_health_events"
  on public.pet_health_events for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_listings"
  on public.adoption_listings for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_listing_media"
  on public.adoption_listing_media for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_applications"
  on public.adoption_applications for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_conversations"
  on public.adoption_conversations for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_messages"
  on public.adoption_messages for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all adoption_reports"
  on public.adoption_reports for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all community_packs"
  on public.community_packs for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all pack_members"
  on public.pack_members for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all pack_posts"
  on public.pack_posts for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all community_meetups"
  on public.community_meetups for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all meetup_attendees"
  on public.meetup_attendees for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "admins manage all community_connections"
  on public.community_connections for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

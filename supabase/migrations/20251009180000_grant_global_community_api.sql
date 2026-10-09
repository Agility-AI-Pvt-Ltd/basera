-- Hosted API roles need table grants in addition to RLS policies.
-- Without these, PostgREST returns 401 "permission denied for table …".

grant usage on schema public to anon, authenticated;

grant select on table public.global_posts to anon, authenticated;
grant insert, update, delete on table public.global_posts to authenticated;

grant select on table public.global_post_likes to anon, authenticated;
grant insert, update, delete on table public.global_post_likes to authenticated;

grant select on table public.global_post_comments to anon, authenticated;
grant insert, update, delete on table public.global_post_comments to authenticated;

grant select on table public.global_follows to anon, authenticated;
grant insert, update, delete on table public.global_follows to authenticated;

grant select on table public.global_post_reports to anon, authenticated;
grant insert, update, delete on table public.global_post_reports to authenticated;

grant select on table public.profiles to anon, authenticated;
grant insert, update on table public.profiles to authenticated;

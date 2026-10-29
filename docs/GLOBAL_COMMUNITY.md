# The Tailz Club Global Community (MVP)

Single worldwide feed shared by **mobile app** and **web** (`/community`).

## Setup

1. Start Supabase and apply migrations:

   ```bash
   supabase start
   pnpm db:migrate
   ```

2. **Mobile**: sign in with email OTP; open the **Community** tab.

3. **Web**: copy `apps/web/.env.example` → `.env` with Supabase URL + anon key, then:

   ```bash
   pnpm dev:web
   ```

   Open [http://localhost:5173/community](http://localhost:5173/community) and sign in with the **same email OTP** as mobile.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| **400** on `global_posts?select=*,author:profiles!author_id(...)` | Old web bundle. Run `pnpm db:migrate` (includes `20251003130000_global_community_fixes.sql`), restart `pnpm dev:web`, hard-refresh the browser. Current code uses `select=*` and loads profiles separately. |
| **401** when clicking **Post** | Usually RLS: no valid user JWT (expired session). Sign out → sign in again with OTP. If you restarted Supabase, clear site data for `localhost` and re-auth. |
| Post fails with profile FK | Complete at least one OTP signup so `profiles` exists (auto-created on first email login). |
| **`poll_ends_at` / schema cache** column not found | Hosted DB is missing poll migrations. Run [`supabase/scripts/hosted_global_polls.sql`](../supabase/scripts/hosted_global_polls.sql) in the Supabase **SQL Editor**, wait ~10s, retry. Local: `supabase start` then `pnpm db:migrate`. |
| **`original_media_storage_key` missing** | Run [`supabase/scripts/hosted_global_post_original_media.sql`](../supabase/scripts/hosted_global_post_original_media.sql) in SQL Editor (or `pnpm db:migrate` locally). |
| **`event_location` / event schema cache** | Run [`supabase/scripts/hosted_global_events.sql`](../supabase/scripts/hosted_global_events.sql) in SQL Editor (or `pnpm db:migrate` locally). |
| **`location_lat` / Tag Location schema cache** | Run [`supabase/scripts/hosted_global_post_location.sql`](../supabase/scripts/hosted_global_post_location.sql) in SQL Editor (or `pnpm db:migrate` locally). |

## Realtime

Posts, likes, and comments sync over **Supabase Realtime** (WebSocket) — no separate WS server.

## Auth session (web)

Local Supabase JWT expiry is set to **1 week** (`jwt_expiry = 604800` in `supabase/config.toml`). Sessions persist in `localStorage` on web and secure storage on mobile.

## Coming soon (UI only)

- Following feed, follows, notifications
- Packs, meetups, local groups
- Following / packs UI polish

## Tables

- `global_posts` (includes poll + event fields)
- `global_post_likes`
- `global_post_comments`
- `global_post_poll_options` / `global_post_poll_votes`
- `global_post_event_rsvps`
- `global_follows` (schema ready; UI later)
- Storage bucket `community-media`

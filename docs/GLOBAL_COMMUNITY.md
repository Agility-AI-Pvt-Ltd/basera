# Basera Global Community (MVP)

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

## Realtime

Posts, likes, and comments sync over **Supabase Realtime** (WebSocket) — no separate WS server.

## Auth session (web)

Local Supabase JWT expiry is set to **1 week** (`jwt_expiry = 604800` in `supabase/config.toml`). Sessions persist in `localStorage` on web and secure storage on mobile.

## Coming soon (UI only)

- Following feed, follows, notifications
- Packs, meetups, local groups
- Video, polls on web (photo posts on mobile)

## Tables

- `global_posts`
- `global_post_likes`
- `global_post_comments`
- `global_follows` (schema ready; UI later)
- Storage bucket `community-media`

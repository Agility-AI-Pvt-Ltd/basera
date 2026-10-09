# Basera Admin (web)

Web dashboard for managing Basera application data stored in Supabase.

## Setup

1. Apply migrations (includes `profiles.is_admin` and admin RLS policies):

   ```bash
   pnpm db:migrate
   ```

   If Supabase reports out-of-order migrations, the root script already runs `migration up --include-all`.

2. Copy env and set Supabase URL + anon key (same project as mobile):

   ```bash
   cp apps/admin/.env.example apps/admin/.env
   ```

3. Create an admin user (local dev example already provisioned):

   | Field | Value |
   | --- | --- |
   | Email | `admin@basera.local` |
   | Password | `BaseraAdmin2026!` |

   To create another admin via CLI (local Supabase running):

   ```bash
   supabase db query "select 1"   # sanity check DB
   ```

   Use Supabase Studio → Authentication → Add user, then:

   ```sql
   update public.profiles set is_admin = true where id = '<auth-user-uuid>';
   ```

4. Install and run:

   ```bash
   pnpm install
   pnpm dev:admin
   ```

   Open [http://localhost:5174](http://localhost:5174).

## Security

- The admin app uses the **anon key** in the browser; access is enforced by Row Level Security (`is_app_admin()`).
- Never put the **service role** key in this app.
- Only trusted accounts should have `is_admin = true`.

## Managed areas

- Users (profiles)
- Pets
- Adoption listings, applications, reports
- Community packs, meetups, posts, neighbor connections

Dashboard shows row counts; each section supports search, edit, delete, and refresh (up to 500 rows per load).

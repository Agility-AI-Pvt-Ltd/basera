# Local email OTP (Brevo / Mailpit)

Login and signup use **email OTP** via Supabase Auth.

## Setup

1. Root `.env` (repo root, not committed):

   ```env
   BREVO_SMTP_USER=your-brevo-smtp-login
   BREVO_SMTP_KEY=your-brevo-smtp-key
   BREVO_SMTP_SENDER=hello@yourdomain.com
   ```

   `BREVO_SMTP_SENDER` must be a **verified sender** in Brevo.

2. Restart Supabase after changing SMTP or templates:

   ```bash
   supabase stop && supabase start
   ```

3. **Mobile**: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `apps/mobile/.env`.

4. **Web community**: same project URL/anon key in `apps/web/.env`.

## Hosted Supabase (dashboard project)

Mobile and web both call `signInWithOtp` with **no** `emailRedirectTo`. The email you receive is controlled by **project Auth settings**, not the app.

If **new** signups get **“Confirm your email address”** with a **link** to the web community instead of a **6-digit code**:

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers** → **Email**
2. Turn **off** **Confirm email** (must match local `enable_confirmations = false` in `supabase/config.toml`).
3. **Authentication** → **Email Templates** → **Confirm signup**: subject **“Your sign-in code for The Tailz Club”**, body should show the code only (no confirmation link). You can mirror `supabase/templates/magic_link.html`.
4. **Authentication** → **URL Configuration**: **Site URL** is only used for link-based emails; with Confirm email off, users should get OTP-only mail.

Existing users should already get the magic-link/OTP template; wrong mail on **first-time** email almost always means Confirm email is still enabled on hosted.

After changing dashboard settings, try a **new** email address or delete the test user in **Authentication** → **Users**, then send OTP again from mobile.

## Testing without Brevo

If custom SMTP is not active (missing `BREVO_SMTP_SENDER` or Supabase was not restarted), Auth uses **Mailpit** only on your dev machine — **nothing is sent to Gmail/Outlook**.

Open [http://127.0.0.1:54324](http://127.0.0.1:54324) on the same PC that runs `supabase start`.

## Not receiving the code on your phone?

1. Confirm root `.env` has all three: `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, **`BREVO_SMTP_SENDER`** (verified sender in Brevo → Senders & Domains).
2. Use an **SMTP key** from Brevo (SMTP & API → SMTP), not the REST API key alone.
3. Restart Auth so it picks up Brevo (not Mailpit):

   ```bash
   supabase stop && supabase start
   ```

4. After restart, Auth should use `smtp-relay.brevo.com`. If mail still only shows in Mailpit, fix `.env` and restart again.
5. Check spam/promotions. Trial Brevo accounts may only send to verified addresses.
6. **Brevo “Unauthorized IP” (525):** In Brevo → **SMTP & API → SMTP**, allow your current public IP (or disable IP restriction for dev). Without this, Auth returns 500 and **no email** is sent — Mailpit will not receive anything either.
7. **Mailpit shows a link, not a 6-digit code:** That means Auth was still on the default Mailpit template (no restart after adding `BREVO_SMTP_SENDER`, or SMTP send failed). After a good restart, subject should be **“Your sign-in code for The Tailz Club”** and the body should show `{{ .Token }}` only (no sign-in link).

## Flow

1. Enter email → **Continue** / **Send OTP**
2. Enter the 6-digit code from the email
3. Complete signup in the app if you are a new user

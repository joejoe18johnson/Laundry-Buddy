# Supabase setup — Laundry Buddy

This folder holds the database schema for moving Laundry Buddy from local AsyncStorage to Supabase.

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Note your **Project URL** and **anon public key** (Settings → API).

## 2. Configure the app

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Fill in:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Restart Expo after changing env vars (`npx expo start -c`).

When both variables are set, the app uses **Supabase Auth + profiles** instead of local AsyncStorage users.

## 3. Run the database migration

**Option A — SQL Editor (quickest)**

1. Open Supabase → SQL Editor.
2. Paste and run each migration in order:
   - `supabase/migrations/20260718000000_initial_schema.sql`
   - `supabase/migrations/20260719000000_admin_profile_updates.sql`
   - `supabase/migrations/20260720000000_app_public_bucket.sql` (optional hosted auth page)
   - `supabase/migrations/20260720100000_phone_login_rpc.sql` (**required for phone login**)

**Option B — Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 4. Auth settings (Supabase dashboard)

### Phone-only sign-up and log-in

Users sign up and log in with a **Belize phone number (+501)**, **email**, and password. Email is required for password reset — it is **not** confirmed at sign-up when confirm email is off.

Under **Authentication → Providers → Email**, turn **off** “Confirm email” so new accounts work immediately.

### Password reset and auth email links

Email links open in the phone browser, which **cannot** load `laundrybuddy://` directly (blank page). Use the hosted callback page:

1. Run `supabase/migrations/20260720000000_app_public_bucket.sql` in the SQL Editor.
2. In **Storage**, open bucket **app-public** → upload `supabase/public/auth-callback.html`.
3. Add these **Redirect URLs** under **Authentication → URL configuration**:

```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app-public/auth-callback.html
laundrybuddy://auth/callback
```

4. In `.env` (optional — auto-detected from project URL if omitted):

```env
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app-public/auth-callback.html
```

5. Restart Expo. Request a **new** password reset email (old links still point at the previous redirect).

The hosted page shows an **Open Laundry Buddy** button, then the app opens to set a new password.

## 5. Storage buckets (optional, for photos)

Create private buckets in Storage:

| Bucket           | Use                          |
|------------------|------------------------------|
| `load-photos`    | Guest load photos            |
| `payment-proofs` | Bank transfer screenshots    |
| `id-documents`   | Identity verification IDs    |

Wire upload helpers in a later phase (bookings + chat migration).

## 6. Integration roadmap

| Phase | Area              | Status        |
|-------|-------------------|---------------|
| 1     | Auth + profiles   | **Started**   |
| 2     | Hosts + settings  | Schema ready  |
| 3     | Bookings          | Schema ready  |
| 4     | Chat + realtime   | Schema ready  |
| 5     | Notifications     | Schema ready  |
| 6     | Reviews + history | Schema ready  |

Local AsyncStorage remains the fallback when env vars are missing, so Expo Go dev without Supabase still works.

## 7. Regenerate TypeScript types (optional)

After schema changes:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/supabase/database.types.ts
```

## Tables

- `profiles` — user accounts (linked to `auth.users`)
- `hosts` — marketplace listings
- `host_settings` — pricing, availability, bank details (JSON)
- `bookings` — full load lifecycle
- `chat_messages` / `chat_read_receipts`
- `notifications`
- `host_reviews`

All tables use Row Level Security so guests and hosts only see their own data.

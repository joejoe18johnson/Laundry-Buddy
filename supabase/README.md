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

## 3. Run database migrations (automatic)

**Recommended — one command**

```bash
npx supabase login          # once per machine
npm run db:migrate          # applies any pending supabase/migrations/*.sql
```

The script links your project from `EXPO_PUBLIC_SUPABASE_URL` in `.env`, runs only migrations that are not yet recorded in Supabase, and updates migration history. Safe to run after every pull — already-applied SQL is skipped.

**Manual options**

- **SQL Editor:** paste each file under `supabase/migrations/` in filename order.
- **Supabase CLI:** `supabase link --project-ref YOUR_REF` then `supabase db push`.

Current migrations (in order):

| File | Purpose |
|------|---------|
| `20260718000000_initial_schema.sql` | Core tables + RLS |
| `20260719000000_admin_profile_updates.sql` | Admin role + verification patch RPC |
| `20260720000000_app_public_bucket.sql` | Hosted auth callback bucket |
| `20260720100000_phone_login_rpc.sql` | Phone login helpers |
| `20260721000000_host_marketplace_sync.sql` | Host listing sync |
| `20260722000000_chat_sync_policies.sql` | Chat RLS + realtime |
| `20260724000000_signup_profile_trigger.sql` | Safer signup profile trigger |
| `20260724100000_notification_sync.sql` | Notifications + push tokens |
| `20260724200000_bookings_realtime.sql` | Booking realtime |
| `20260731000000_booking_host_sync.sql` | Host booking sync |
| `20260731100000_notification_push_delivery.sql` | Push delivery RPC |
| `20260731110000_booking_pickup_confirmation.sql` | Pickup confirmation fields |
| `20260801000000_host_reviews_unique_booking.sql` | One review per booking |
| `20260802000000_guest_search_preferences.sql` | Guest search radius + location sync |

## 4. Auth settings (Supabase dashboard)

### Phone-only sign-up and log-in

Users sign up and log in with a **Belize phone number (+501)**, **email**, and password. Email is required for password reset — it is **not** confirmed at sign-up when confirm email is off.

Under **Authentication → Providers → Email**, turn **off** “Confirm email” so new accounts work immediately.

### Password reset and auth email links

Email links open in the phone browser, which **cannot** load `laundrybuddy://` directly (blank page). Use the hosted callback page:

1. Run `supabase/migrations/20260720000000_app_public_bucket.sql` in the SQL Editor.
2. Upload hosted pages (automated — see **§4b** below), or manually in **Storage** → **app-public**:
   - `supabase/public/auth-callback.html`
   - `supabase/public/host-profile.html`
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

### 4b. Upload hosted pages (CLI script)

After the `app-public` bucket migration, upload `auth-callback.html` and `host-profile.html` from your machine:

1. In Supabase → **Settings → API**, copy the **service_role** key (secret — not the anon key).
2. Add to `.env` (never commit this value):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Run:

```bash
npm run upload:app-public
```

Upload a single file:

```bash
node scripts/upload-app-public.mjs --file host-profile.html
```

The script upserts every file in `supabase/public/` and prints the public URLs. Copy `EXPO_PUBLIC_AUTH_REDIRECT_URL` from the output if you use the hosted auth callback.

**Host profile share links** do not use Storage HTML — Supabase serves `.html` from Storage as `text/plain` (raw source in the browser). Deploy the Edge Function instead:

```bash
npx supabase login
npm run deploy:host-profile
```

Share links then use `https://YOUR_PROJECT.supabase.co/functions/v1/host-profile?host=...&user=...`, which renders correctly and opens the app.

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
| 4     | Chat + realtime   | **Started**   |
| 5     | Notifications     | Schema ready  |
| 6     | Reviews + history | Schema ready  |

Local AsyncStorage remains the fallback when env vars are missing, so Expo Go dev without Supabase still works.

### Chat sync (required for cross-device APK testing)

Included in `npm run db:migrate` — or run `20260722000000_chat_sync_policies.sql` manually so:

- Messages sync through `chat_messages` instead of device-only storage
- Admins can reply in `support:{userId}` threads from another device
- Realtime updates deliver new messages while the app is open

Preview/production EAS builds must include `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `eas.json`).

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

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
2. Paste the contents of `supabase/migrations/20260718000000_initial_schema.sql`.
3. Run.

**Option B — Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 4. Auth settings (Supabase dashboard)

Under **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `laundrybuddy://auth/callback` |
| **Redirect URLs** | Add `laundrybuddy://**` (and `exp+laundry-buddy://**` if testing in Expo Go) |

The default Supabase Site URL is `http://localhost:3000`. If you leave that in place, email confirmation links open a browser error on phones (`localhost refused to connect`). The app sends `emailRedirectTo: laundrybuddy://auth/callback` on sign-up, but Supabase only allows redirects listed above.

Under **Authentication → Providers → Email**:

- Enable email provider.
- For quick local testing only, you can disable **Confirm email** so sign-up works immediately without a link.

Phone logins look up the user’s profile by phone, then sign in with their signup email behind the scenes.

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

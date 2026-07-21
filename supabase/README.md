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

### Upload the email confirmation page (required — fixes blank browser page)

1. In Supabase → **Storage**, create a **public** bucket named `app-public`.
2. Upload `supabase/public/auth-callback.html` to that bucket (keep the filename `auth-callback.html`).
3. Confirm it opens in the browser, e.g.  
   `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app-public/auth-callback.html`

### URL configuration

Under **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app-public/auth-callback.html` |
| **Redirect URLs** | Same URL as Site URL, plus `laundrybuddy://auth/callback` and `laundrybuddy://**` |

The app sends confirmation emails to the hosted HTML page (not `localhost` and not a raw deep link). That page shows “Email confirmed” and opens the Laundry Buddy app with the login tokens.

Optional override in `.env`:

```env
EXPO_PUBLIC_AUTH_REDIRECT_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/app-public/auth-callback.html
```

Under **Authentication → Providers → Email**:

- Enable email provider.
- For quick local testing only, you can disable **Confirm email** so sign-up works immediately without a link.

Phone logins look up the user’s profile by phone, then sign in with their signup email behind the scenes.

### Email rate limits (important while testing)

Supabase’s **built-in email** allows about **2 auth emails per hour** for the whole project. Repeated sign-up tests hit this quickly and show `email rate limit exceeded`.

**Fastest fix for development:**

1. Supabase → **Authentication → Providers → Email**
2. Turn **off** “Confirm email”
3. Sign up again — no confirmation email is sent; you can log in immediately with phone + password

**Other options:**

- Wait ~1 hour, then use a confirmation link already in your inbox (don’t sign up again)
- Manually confirm a user: **Authentication → Users** → select user → confirm email
- For production: set up **custom SMTP** (Authentication → SMTP) — raises limits to ~30/hour+

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

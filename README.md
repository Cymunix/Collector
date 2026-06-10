# CollectorsHub Web

CollectorsHub frontend built with React + Vite.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Supabase Setup

Environment variables are loaded from `.env.local`.

Required keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Profiles + Subscription Tiers Migration

Run the SQL in [supabase/migrations/20260525_profiles_and_subscription_tiers.sql](supabase/migrations/20260525_profiles_and_subscription_tiers.sql) using the Supabase SQL Editor.

This migration creates:

- `public.subscription_tier` enum
- `public.subscription_plans` table with seeded tiers
- `public.profiles` table (1:1 with `auth.users`)
- Trigger to auto-create profile rows on sign-up
- RLS policies for profile ownership and public plan reads

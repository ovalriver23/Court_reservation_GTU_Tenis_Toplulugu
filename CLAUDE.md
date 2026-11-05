# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository. Keep it in sync with reality — update it in the same commit as any behavior change.

## Project

Court reservation web app for the GTU (Gebze Technical University) tennis club. One court, hourly slots, 1–2 players per slot (booker + optional partner). Mobile-first, Turkish UI. Live at https://www.gtutennis.com.tr.

## Stack

Next.js 15.5 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (Auth, Postgres, Realtime, pg_cron) · Resend (email) · Vercel (hosting, functions run in UTC)

## Commands (run from `kort-rezervasyon/`)

```bash
npm run dev          # local dev server
npm run build        # production build
npm run lint         # ESLint CLI (next lint is deprecated)
npx tsc --noEmit     # type check
```

There is no separate dev database: `.env.local` points at production Supabase.

## Structure

```
kort-rezervasyon/src/
  app/
    (auth)/            login, register, verify (email OTP), forgot-password, reset-password, mfa-challenge
    (app)/             page.tsx (week calendar + slots, client), reservations, profile, admin
    auth/callback/     Supabase auth redirect handler
  components/          SlotCard, WeekCalendar, AdminReserveForm, SettingsForm, WarnUserModal, FeedbackButton, ...
  lib/
    actions/           server actions: auth.ts, reserve.ts, admin.ts, users.ts, feedback.ts
    supabase/          client.ts (browser), server.ts (createClient = user session, createAdminClient = secret key)
    cache.ts           per-request getUser()/getProfile() via React cache()
    time.ts            Turkey-time helpers (see Time below)
    escape.ts          escapeHtml() for user text inside emails
  middleware.ts        auth guard, MFA (aal2) check, /admin requires is_admin
kort-rezervasyon/supabase/
  schema.sql           pg_dump of the public schema (source of truth)
  auth-and-cron.sql    objects outside public: auth.users trigger, pg_cron job
```

## Data model

- `profiles` — `id` (= auth.users.id), `name`, `email`, `is_admin`, `created_at`, `name_changed_at` (name change allowed once per 30 days). Created by the `handle_new_user` trigger and upserted on register.
- `slots` — `date`, `time` (text `"HH:MM"`), `player1_id/_name` (booker), `player2_id/_name` (partner, optional), `is_admin_reserved`; `unique(date, time)`. A slot is free when `player1_id is null`. Booked slots are never deleted: they are the reservation history and the weekly limit counts them.
- `app_settings` — single row `id = 1`: `slot_start`, `slot_end`, `daily_limit`, `weekly_limit` (0 = unlimited), `prime_time_start/_end`, `min_cancel_hours`.

## Security model — rules that must not be broken

1. **Never trust identity or names from the client.** `reserve_slot` takes the user from `auth.uid()` (it rejects a mismatching `p_user_id`) and reads both names from `profiles`. Server actions get the user from the session, never from arguments.
2. **RLS and grants:** `profiles` — authenticated users can read only their own row; no insert/update/delete for `anon`/`authenticated`. `slots` — readable by authenticated users only; no direct writes. `app_settings` — read-only. Every write goes through `reserve_slot` or server actions using the secret key.
3. **Functions:** `security definer` functions must `set search_path = public` and have `execute` revoked from `public`/`anon` (grant to `authenticated` only where needed).
4. **Registration:** `@gtu.edu.tr` is enforced in the register action *and* by the `enforce_gtu_email` trigger on `auth.users` (insert and email change). Do not rely on the UI check alone.
5. **Secrets:** never commit keys. The browser uses the publishable key; the secret key is server-only (`createAdminClient`). Legacy JWT keys are disabled and the legacy JWT secret is revoked.
6. **Email:** any user-provided text in Resend HTML must go through `escapeHtml()`. Feedback requires a logged-in user; sender name comes from the profile.

## Reservations

- Always reserve through the `reserve_slot` RPC (never in app code). It locks `app_settings` then the slot row (`FOR UPDATE`), so limits and double-booking are race-free.
- Checks: slot must exist, be free and not yet started (Europe/Istanbul); daily limit; weekly limit (calendar week Mon–Sun of the booked date); prime time max 1 per week; the same three limits for the partner. Slots with `is_admin_reserved` don't count toward limits.
- Error codes are mapped to Turkish messages in `RESERVE_ERRORS` (`lib/actions/reserve.ts`) and typed in `ReserveSlotResult`. Add both when adding a code.
- Cancel (`cancelSlot`): rejected if the slot has started or is within `min_cancel_hours`; either player can cancel; ownership is part of the UPDATE's WHERE clause (atomic).
- Admin manual reservations and admin cancel use the secret key; admin cancel also clears the partner and `is_admin_reserved`.

## Slots

- `generate_slots()` (SQL) creates missing slots for today + 13 days within `slot_start..slot_end` and deletes only *empty* slots older than 7 days. pg_cron job `generate-slots` runs it daily at 21:05 UTC (00:05 Turkey).
- `regenerateSlots()` (admin.ts) does the same from the app when settings change or the admin presses "Slotları Yenile", and removes empty slots outside the new hours.
- The UI shows the current week (Mon–Sun) and filters slots to the configured hours.

## Time

Vercel runs in UTC; Turkey is UTC+3 all year. On the server, never build dates with `new Date("YYYY-MM-DDTHH:MM")` or `getDate()` — use `lib/time.ts`: `slotTimeMs(date, time)`, `todayTR()`, `addDaysTR()`, `weekBoundsTR()`. In SQL use `now() at time zone 'Europe/Istanbul'`. Client components use the browser's local time.

## Auth flow

Register (`@gtu.edu.tr`) → email OTP at `/verify` → app. No admin approval step. Optional TOTP MFA (`/mfa-challenge` when the session is aal1 but the user has a factor). Forgot/reset password uses `NEXT_PUBLIC_APP_URL`.

## Admin panel (`/admin`)

Server component, tabs via `?tab=`: Özet, Üyeler (search, view reservations, warning email, admin toggle, delete), Rezervasyonlar (active/past, cancel), Manuel (book on behalf of names), Ayarlar. `searchParams` is a Promise (Next 15).

## Performance notes

- `next.config.mjs` sets `experimental.staleTimes.dynamic = 30` to keep Next 14's client cache behavior; mutations call `revalidatePath`.
- Supabase is in `eu-west-1`; keep Vercel functions in a nearby region (e.g. `dub1`).

## Database changes workflow

1. Apply the change in the Supabase SQL Editor (save the query there with a descriptive name).
2. Re-dump and commit:
   ```bash
   pg_dump "postgresql://postgres.<ref>@<pooler-host>:5432/postgres" \
     --schema-only --schema=public --no-owner -f supabase/schema.sql
   sed -i '' '/^\\restrict /d; /^\\unrestrict /d' supabase/schema.sql   # macOS sed
   ```
3. If the change touches `auth` or `cron`, update `supabase/auth-and-cron.sql` by hand.

## UI conventions

Clay court theme (see `tailwind.config.ts`; three selectable background themes in `lib/theme.tsx`). Font: Lexend. Gate hover styles with `@media (hover: hover) and (pointer: fine)`. Buttons use `active:scale-95 transition-transform`.

## Deploying

Push to `main` deploys to production. For risky changes (dependency upgrades, auth, middleware) push a branch first and test the Vercel Preview URL before merging.

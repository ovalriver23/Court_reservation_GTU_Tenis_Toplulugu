# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tennis court reservation web app for a university tennis club (GTU Tenis). Replaces WhatsApp chaos with a calendar-based booking system. Single court, single player per slot, mobile-first, clean and functional.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Styling:** Tailwind CSS — clay court color theme
- **Hosting:** Vercel
- **Language:** TypeScript

## Commands

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

All commands run from `kort-rezervasyon/`.

## Project Structure

```
kort-rezervasyon/
  public/
    court.jpeg              # Clay court photo used as auth background
  src/
    app/
      (auth)/
        layout.tsx          # Court background (CourtLines) + overflow:hidden
        login/
        register/
        verify/             # OTP email verification step after register
      (app)/
        layout.tsx          # Burger menu (HamburgerMenu component), uses getProfile() cache
        page.tsx            # Calendar + time slots (main screen, client component)
        admin/              # Admin panel — 4 tabs: Özet, Üyeler, Rezervasyonlar, Ayarlar
        profile/
        reservations/       # User's own active reservations
      pending/              # Shown to unapproved users
    components/
      CourtLines.tsx        # Fixed background using court.jpeg
      SlotCard.tsx          # Single slot UI card (reserve / cancel)
      WeekCalendar.tsx      # 14-day horizontal date picker
      SettingsForm.tsx      # Admin settings form (client component)
    lib/
      actions/
        auth.ts             # login, register, logout, verifyEmail, resendVerification
        reserve.ts          # reserveSlot (with limit checks), cancelSlot
        admin.ts            # approveUser, rejectUser, updateSettings, refreshSlots, adminCancelSlot
      supabase/
        client.ts           # Browser Supabase client
        server.ts           # Server Supabase client + createAdminClient()
      cache.ts              # Per-request cached getUser() and getProfile() via React cache()
    types/
      index.ts              # Profile (with is_admin), Slot, ReserveSlotResult, Database types
    middleware.ts           # Auth guard + approval check + admin route protection
```

## Design System — Clay Court Theme

```ts
// tailwind.config.ts
colors: {
  primary:    '#D0FF00',  // neon yellow-green accent
  background: '#A3472E',  // clay court red-brown
  surface:    '#7A2810',  // darker clay for cards/surfaces
  border:     '#C05535',  // medium clay for borders
  text: {
    primary:   '#FFFFFF',
    secondary: '#888888',
  }
}
```

Font: **Lexend** (Google Fonts). Mobile-first — always use `@media (hover: hover) and (pointer: fine)` for hover states.

### Auth Pages (login / register / verify)
- Background: `court.jpeg` photo via `CourtLines` component (fixed, full-screen)
- Card: glassmorphism — `background: rgba(0,0,0,0.25)`, `backdropFilter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.12)`
- Logo: static tennis ball SVG (yellow #D0FF00 with seam paths), 52px, centered
- Inputs: `background: rgba(255,255,255,0.1)`

## Database Schema

### `profiles`
```sql
id uuid references auth.users primary key,
name text not null,
email text not null,
approved boolean default false,   -- admin must approve before login works
is_admin boolean default false,   -- admins bypass approval and can access /admin
created_at timestamptz default now()
```

### `slots`
```sql
id uuid primary key default gen_random_uuid(),
date date not null,
time text not null,               -- "08:00", "09:00", ...
player1_id uuid references profiles(id),
player1_name text,
created_at timestamptz default now(),
unique(date, time)
```

### `app_settings`
```sql
id integer primary key,           -- always row id=1 (single-row config table)
slot_start text default '08:00',  -- court opening time
slot_end   text default '20:00',  -- court closing time
daily_limit  integer default 0,   -- 0 = unlimited
weekly_limit integer default 0    -- 0 = unlimited
```

## Business Rules

### Reservation Limits (Configurable)
Daily and weekly limits are set per user via `app_settings` (id=1). `0` means unlimited. Enforced in `reserve.ts` before calling the RPC. Admin can change them from `/admin?tab=settings`.

### Single Player Per Slot
Only one player per slot. Slot is either free (`player1_id IS NULL`) or taken (`player1_id IS NOT NULL`).

### Calendar Window
14-day rolling window. Users can see and book slots from today up to 14 days ahead.

### UI Visibility
Main page fetches `app_settings` and filters slots to `[slot_start, slot_end]`. For today, slots before the current hour are hidden (frontend filter).

### Date Formatting — CRITICAL
Always use local date formatting, never `.toISOString()` (returns UTC, causes date drift for Turkey UTC+3).

```ts
function toDateString(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
```

## Race Condition — Use Supabase RPC

Never do reservation logic in application code. Always call the `reserve_slot` RPC:

```sql
create or replace function reserve_slot(
  p_date date,
  p_time text,
  p_user_id uuid,
  p_user_name text
)
returns json
language plpgsql
security definer
as $$
declare
  v_slot slots%rowtype;
begin
  select * into v_slot from slots
  where date = p_date and time = p_time
  for update;

  if not found then
    insert into slots (date, time, player1_id, player1_name)
    values (p_date, p_time, p_user_id, p_user_name);
    return json_build_object('success', true);
  end if;

  if v_slot.player1_id is null then
    update slots set player1_id = p_user_id, player1_name = p_user_name
    where date = p_date and time = p_time;
    return json_build_object('success', true);
  end if;

  return json_build_object('success', false, 'error', 'slot_full');
end;
$$;
```

## Cancel Logic

Cancellation uses the admin client (bypasses RLS) with a manual ownership check:

```ts
const admin = createAdminClient();
const { data: slot } = await admin.from("slots")
  .select("player1_id")
  .eq("date", date).eq("time", time).single();

if (slot.player1_id !== user.id) return { error: "Bu rezervasyon size ait değil." };

await admin.from("slots")
  .update({ player1_id: null, player1_name: null })
  .eq("date", date).eq("time", time);
```

## Slot Generation — `regenerateSlots`

When admin updates settings, `regenerateSlots(slot_start, slot_end)` in `admin.ts` is called automatically. It:
1. Upserts slots for the next 14 days within the new time range (skips existing)
2. Deletes unbooked slots outside the new range (before `slot_start` or after `slot_end`)

Admin can also trigger this manually from `/admin?tab=settings → "Slotları Yenile"` button.

## Cron Job (Supabase pg_cron — NOT YET SET UP)

Still needs to be configured. The intended daily job at 23:59:

```sql
-- Delete today's slots (day is over)
delete from slots where date = current_date;

-- Create slots for 14 days ahead using current app_settings
insert into slots (date, time)
select
  current_date + 14,
  t
from generate_series(
  (select slot_start::time from app_settings where id = 1),
  (select slot_end::time   from app_settings where id = 1),
  interval '1 hour'
) as t
on conflict (date, time) do nothing;
```

Enable pg_cron: Supabase Dashboard → Database → Extensions → pg_cron.

## Auth Flow

1. User registers with email/password
2. Supabase sends OTP email → user redirected to `/verify?email=...`
3. User enters 6-digit OTP → `verifyEmail()` calls `supabase.auth.verifyOtp()`
4. On success → redirected to `/pending` (approved: false by default)
5. Admin approves from `/admin?tab=users`
6. Admins (`is_admin: true`) bypass approval check entirely and can access `/admin`
7. Unapproved non-admin users always see `/pending`

## Admin Panel (`/admin`)

Tab-based server component. Only users with `is_admin: true` can access (middleware enforces).

| Tab | Content |
|-----|---------|
| Özet | Stats: total members, pending count, today's reservations, active reservations |
| Üyeler | List all non-admin users; approve or reject (delete) |
| Rezervasyonlar | All active (booked) slots; admin can cancel any |
| Ayarlar | Configure court hours and daily/weekly limits; manual slot refresh |

Badge on "Üyeler" tab shows pending count. `pendingCount` is fetched on every tab render.

## Supabase Clients

```ts
// server.ts
createClient()       // SSR client with cookie handling — respects RLS
createAdminClient()  // Service role client — bypasses RLS, server-side only
```

Use `createAdminClient()` for: profile creation on register, slot cancellation, admin actions.
Use `createClient()` for: reading auth session, fetching user data.

## Per-Request Cache (`lib/cache.ts`)

```ts
import { cache } from "react";

export const getUser    = cache(async () => { /* supabase.auth.getUser() */ });
export const getProfile = cache(async () => { /* profiles select with is_admin */ });
```

Layout and pages share one auth API call per request via React's `cache()`. Always import from `@/lib/cache` instead of calling Supabase directly when you need the current user/profile in server components.

## Row Level Security

```sql
-- Anyone can read slots (for calendar view)
create policy "slots herkes okuyabilir" on slots
  for select using (true);

-- Only owner can update their slot (cancel)
-- Note: in practice we bypass this with admin client + manual check
create policy "kullanici kendi slotunu guncelleyebilir" on slots
  for update using (auth.uid() = player1_id);
```

## Realtime

Main page (`page.tsx`) subscribes to slot changes for the selected date:

```ts
supabase.channel(`slots-${selectedDate}`)
  .on("postgres_changes", {
    event: "*", schema: "public", table: "slots",
    filter: `date=eq.${selectedDate}`
  }, () => fetchSlots(selectedDate))
  .subscribe();
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only, never expose to client
```

## Pending / TODO

- [ ] **pg_cron setup** — slots not yet auto-generated nightly; must use admin panel's "Slotları Yenile" for now. The cron query should read `slot_start`/`slot_end` from `app_settings` instead of hardcoded hours.
- [ ] **Email on approval** — notify user (email) when admin approves their account
- [ ] **Limit enforcement UX** — when daily/weekly limit is hit, `SlotCard` should show a meaningful disabled state (currently only the server action returns an error string)

## UI Notes

- Slot cards: `active:scale-95 transition-transform` for press feedback
- All hover animations must be gated with `@media (hover: hover) and (pointer: fine)`
- `overflow-hidden` on auth layout — prevents scroll when animated elements exist
- Admin tab bar uses `Link` (not buttons) for tab switching — each tab is a full server-rendered page load

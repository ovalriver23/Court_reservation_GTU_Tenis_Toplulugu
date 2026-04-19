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
      (app)/
        layout.tsx          # Burger menu (HamburgerMenu component)
        page.tsx            # Calendar + time slots (main screen, client component)
        profile/
        reservations/       # User's own active reservations
      pending/              # Shown to unapproved users
    components/
      CourtLines.tsx        # Fixed background using court.jpeg
      SlotCard.tsx          # Single slot UI card (reserve / cancel)
      WeekCalendar.tsx      # 14-day horizontal date picker
      TennisBall.tsx        # (unused) standalone bouncing ball
      TennisBallLogo.tsx    # (unused) interactive ball logo experiment
    lib/
      actions/
        auth.ts             # login, register, logout server actions
        reserve.ts          # reserveSlot, cancelSlot server actions
      supabase/
        client.ts           # Browser Supabase client
        server.ts           # Server Supabase client + createAdminClient()
    types/
      index.ts              # Profile, Slot, ReserveSlotResult, Database types
    middleware.ts           # Auth guard + approval check
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

### Auth Pages (login / register)
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
approved boolean default false,  -- admin must approve before login works
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

> ⚠️ player2_id and player2_name have been removed. Single player per slot only.

## Business Rules

### No Quota Limits
There are **no weekly or daily limits**. Any approved user can reserve any available slot. First come, first served.

### Single Player Per Slot
Only one player per slot. Slot is either free (`player1_id IS NULL`) or taken (`player1_id IS NOT NULL`).

### Calendar Window
14-day rolling window. Users can see and book slots from today up to 14 days ahead.

### UI Visibility
Only show slots from current time onward for today (frontend filter). Future dates show all slots.

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

## Cron Job (Supabase pg_cron — runs 23:59 daily)

```sql
-- Delete today's slots (day is over)
delete from slots where date = current_date;

-- Create slots for 14 days ahead (rolling window)
insert into slots (date, time)
select
  current_date + 14,
  t
from unnest(array[
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00'
]) as t
on conflict (date, time) do nothing;
```

Enable pg_cron: Supabase Dashboard → Database → Extensions → pg_cron.

## Auth Flow

1. User registers with email/password → `approved: false`
2. Admin approves from Supabase dashboard (admin page planned but not built yet)
3. User can only access the app after `approved: true`
4. Unapproved users see `/pending` page

## Supabase Clients

```ts
// server.ts
createClient()       // SSR client with cookie handling — respects RLS
createAdminClient()  // Service role client — bypasses RLS, server-side only
```

Use `createAdminClient()` for: profile creation on register, slot cancellation.
Use `createClient()` for: reading auth session, fetching user data.

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
supabase.channel("slots")
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

- [ ] **Admin page** (`/admin`) — approve/reject pending users, view all reservations, cancel any slot
- [ ] **pg_cron setup** — slots not yet auto-generated; needs manual seeding for now
- [ ] **Type cleanup** — `types/index.ts` still has `player2_id`/`player2_name` in Slot type, remove them
- [ ] **Email on approval** — notify user when admin approves their account

## UI Notes

- Slot cards: `active:scale-95 transition-transform` for press feedback
- All hover animations must be gated with `@media (hover: hover) and (pointer: fine)`
- `overflow-hidden` on auth layout — prevents scroll when animated elements exist

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tennis court reservation web app for a university tennis club. Replaces WhatsApp chaos with a calendar-based booking system. Single court, mobile-first, clean and functional.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Styling:** Tailwind CSS — Volt Onyx theme
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
  src/
    app/
      (auth)/
        login/
        register/
      (app)/
        layout.tsx        # Burger menu lives here
        page.tsx          # Calendar + time slots (main screen)
        profile/
        reservations/     # User's own reservations
    components/
    lib/
      supabase/
        client.ts         # Browser client
        server.ts         # Server-side client (uses SERVICE_ROLE_KEY)
    types/
```

## Design System — Volt Onyx

```ts
// tailwind.config.ts
colors: {
  primary: '#D0FF00',       // accent
  background: '#121212',
  surface: '#1E1E1E',
  border: '#2A2A2A',
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
  }
}
```

Font: **Lexend** (Google Fonts). Mobile-first — always use `@media (hover: hover) and (pointer: fine)` for hover states.

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
player2_id uuid references profiles(id),
player2_name text,
created_at timestamptz default now(),
unique(date, time)
```

## Business Rules — CRITICAL

### Weekly Limit
- Max **3 reservations per week** per user
- Rolling window: looks at the last 7 calendar days
- Counted by **distinct dates**, not by number of slots

```sql
-- Correct query for weekly count
SELECT COUNT(DISTINCT date)
FROM slots
WHERE (player1_id = $uid OR player2_id = $uid)
  AND date >= CURRENT_DATE - INTERVAL '6 days'
  AND date <= CURRENT_DATE
```

### Fairness Rule — VERY IMPORTANT
Users who book 10:00 and 12:00 on the same day must have their weekly right freed at **midnight**, not when their slot time passes. Do NOT free a slot at 11:00 just because the 10:00 slot is over. The entire day counts as "used" until midnight.

### Daily Limit
One slot per user per day — no monopolizing the court.

### Capacity
Max 2 players per slot. Slot locks when full.

### UI Visibility
Only show slots from current time onward (frontend filter). But for weekly count calculation, the full day always counts until midnight. These two rules complement each other.

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
  v_weekly_count int;
  v_today_count int;
begin
  select count(distinct date) into v_weekly_count
  from slots
  where (player1_id = p_user_id or player2_id = p_user_id)
    and date >= current_date - interval '6 days'
    and date <= current_date;

  if v_weekly_count >= 3 then
    return json_build_object('success', false, 'error', 'weekly_limit');
  end if;

  select count(*) into v_today_count
  from slots
  where (player1_id = p_user_id or player2_id = p_user_id)
    and date = p_date;

  if v_today_count > 0 then
    return json_build_object('success', false, 'error', 'daily_limit');
  end if;

  select * into v_slot from slots
  where date = p_date and time = p_time
  for update;

  if not found then
    insert into slots (date, time, player1_id, player1_name)
    values (p_date, p_time, p_user_id, p_user_name);
    return json_build_object('success', true, 'position', 1);
  end if;

  if v_slot.player1_id is null then
    update slots set player1_id = p_user_id, player1_name = p_user_name
    where date = p_date and time = p_time;
    return json_build_object('success', true, 'position', 1);
  end if;

  if v_slot.player2_id is null then
    update slots set player2_id = p_user_id, player2_name = p_user_name
    where date = p_date and time = p_time;
    return json_build_object('success', true, 'position', 2);
  end if;

  return json_build_object('success', false, 'error', 'slot_full');
end;
$$;
```

## Cron Job (Supabase pg_cron — runs 23:59 daily)

```sql
-- Delete today's slots
delete from slots where date = current_date;

-- Create slots for 7 days ahead (if not exists)
insert into slots (date, time)
select
  current_date + 7,
  unnest(array['08:00','09:00','10:00','11:00','12:00',
               '13:00','14:00','15:00','16:00','17:00',
               '18:00','19:00','20:00'])
on conflict (date, time) do nothing;
```

This maintains a rolling 7-day reservation window.

## Auth Flow

1. User registers with email/password → `approved: false`
2. Admin manually approves from Supabase dashboard (or simple admin page)
3. User can only access the app after `approved: true`
4. Future: restrict to `@okuladi.edu.tr` domain

## Row Level Security

```sql
-- Users can only cancel their own reservations
create policy "kullanici kendi slotunu guncelleyebilir" on slots
  for update using (
    auth.uid() = player1_id or auth.uid() = player2_id
  );
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only, never expose to client
```

## UI Notes

- Slot cards: use `active:scale-95 transition-transform` for press feedback
- Realtime: subscribe to Supabase Realtime for live slot availability updates
- All hover animations must be gated with `@media (hover: hover) and (pointer: fine)`

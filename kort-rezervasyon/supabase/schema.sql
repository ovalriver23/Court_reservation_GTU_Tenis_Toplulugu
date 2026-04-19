-- ============================================================
-- 1. PROFILES TABLOSU
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  approved boolean default false,
  created_at timestamptz default now()
);

-- Yeni kullanıcı kaydolunca otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 2. SLOTS TABLOSU
-- ============================================================
create table public.slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text not null,
  player1_id uuid references public.profiles(id) on delete set null,
  player1_name text,
  player2_id uuid references public.profiles(id) on delete set null,
  player2_name text,
  created_at timestamptz default now(),
  unique(date, time)
);


-- ============================================================
-- 3. RESERVE_SLOT RPC (race condition koruması)
-- ============================================================
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
  -- Haftalık hak kontrolü (gün bazlı rolling window)
  select count(distinct s1."date") into v_weekly_count
  from slots s1
  where (s1.player1_id = p_user_id or s1.player2_id = p_user_id)
    and s1."date" >= current_date - interval '6 days'
    and s1."date" <= current_date;

  if v_weekly_count >= 3 then
    return json_build_object('success', false, 'error', 'weekly_limit');
  end if;

  -- Aynı gün başka rezervasyon var mı?
  select count(*) into v_today_count
  from slots s2
  where (s2.player1_id = p_user_id or s2.player2_id = p_user_id)
    and s2."date" = p_date;

  if v_today_count > 0 then
    return json_build_object('success', false, 'error', 'daily_limit');
  end if;

  -- Slotu kilitle ve oku (FOR UPDATE = row lock)
  select * into v_slot from slots s3
  where s3."date" = p_date and s3.time = p_time
  for update;

  -- Slot yoksa oluştur (player1 olarak)
  if not found then
    insert into slots ("date", time, player1_id, player1_name)
    values (p_date, p_time, p_user_id, p_user_name);
    return json_build_object('success', true, 'position', 1);
  end if;

  -- player1 boşsa doldur
  if v_slot.player1_id is null then
    update slots set player1_id = p_user_id, player1_name = p_user_name
    where "date" = p_date and time = p_time;
    return json_build_object('success', true, 'position', 1);
  end if;

  -- player2 boşsa doldur
  if v_slot.player2_id is null then
    update slots set player2_id = p_user_id, player2_name = p_user_name
    where "date" = p_date and time = p_time;
    return json_build_object('success', true, 'position', 2);
  end if;

  -- İkisi de dolu
  return json_build_object('success', false, 'error', 'slot_full');
end;
$$;


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.slots enable row level security;

-- Profiles: herkes okuyabilir, sadece kendi profilini güncelleyebilir
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Slots: herkes okuyabilir
create policy "slots_select" on public.slots
  for select using (true);

-- Slots: sadece kendi player alanını null yapabilir (iptal)
create policy "slots_cancel_own" on public.slots
  for update using (
    auth.uid() = player1_id or auth.uid() = player2_id
  );


-- ============================================================
-- 5. BAŞLANGIÇ SLOTLARI (önümüzdeki 7 gün)
-- ============================================================
do $$
declare
  d date;
begin
  for d in
    select generate_series(current_date, current_date + 6, interval '1 day')::date
  loop
    insert into slots ("date", time)
    select d, unnest(array[
      '08:00','09:00','10:00','11:00','12:00',
      '13:00','14:00','15:00','16:00','17:00',
      '18:00','19:00','20:00'
    ])
    on conflict ("date", time) do nothing;
  end loop;
end;
$$;


-- ============================================================
-- 6. CRON JOB (Supabase Dashboard > Database > Cron Jobs)
-- pg_cron extension etkinleştirilmiş olmalı
-- ============================================================
-- Her gece 23:59'da çalışır:
--
-- select cron.schedule(
--   'daily-slot-cleanup',
--   '59 23 * * *',
--   $$
--     delete from slots where date = current_date;
--     insert into slots (date, time)
--     select
--       current_date + 7,
--       unnest(array['08:00','09:00','10:00','11:00','12:00',
--                    '13:00','14:00','15:00','16:00','17:00',
--                    '18:00','19:00','20:00'])
--     on conflict (date, time) do nothing;
--   $$
-- );

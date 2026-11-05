--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: enforce_gtu_email(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_gtu_email() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  if new.email is null or lower(new.email) not like '%@gtu.edu.tr' then
    raise exception 'Sadece @gtu.edu.tr adresleriyle kayıt olunabilir'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;


--
-- Name: generate_slots(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_slots() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
  v_start int;
  v_end   int;
begin
  select split_part(slot_start, ':', 1)::int,
         split_part(slot_end,   ':', 1)::int
    into v_start, v_end
  from app_settings where id = 1;

  -- Bugünden itibaren 14 gün için eksik slotları oluştur
  insert into slots (date, time)
  select d::date, lpad(h::text, 2, '0') || ':00'
  from generate_series(v_today, v_today + 13, interval '1 day') as d,
       generate_series(v_start, v_end) as h
  on conflict (date, time) do nothing;

  -- Bir haftadan eski BOŞ slotları temizle; dolu olanlar geçmiş kaydı olarak kalır
  delete from slots
  where date < v_today - 7 and player1_id is null;
end;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$                                                                     
  begin
    insert into public.profiles (id, name, email)                               
    values (new.id, coalesce(new.raw_user_meta_data->>'name', ''), new.email);
    return new;                                                                 
  end;
  $$;


--
-- Name: reserve_slot(date, text, uuid, text, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reserve_slot(p_date date, p_time text, p_user_id uuid, p_user_name text, p2_user_id uuid, p2_user_name text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
declare
  v_uid        uuid := auth.uid();
  v_name       text;
  v_p2_name    text;
  v_slot       slots%rowtype;
  v_settings   app_settings%rowtype;
  v_count      integer;
  v_week_start date;
  v_is_prime   boolean;
  v_pt_start   text;
  v_pt_end     text;
begin
  -- Kimlik: parametreye değil oturuma güven
  if v_uid is null then
    return json_build_object('success', false, 'error', 'not_authenticated');
  end if;
  if p_user_id is distinct from v_uid then
    return json_build_object('success', false, 'error', 'forbidden');
  end if;

  select name into v_name from profiles where id = v_uid;
  if not found then
    return json_build_object('success', false, 'error', 'profile_not_found');
  end if;

  if p2_user_id is not null then
    if p2_user_id = v_uid then
      return json_build_object('success', false, 'error', 'invalid_partner');
    end if;
    select name into v_p2_name from profiles where id = p2_user_id;
    if not found then
      return json_build_object('success', false, 'error', 'partner_not_found');
    end if;
  end if;

  -- Saat biçimi ve geçmiş kontrolü (Türkiye saati)
  if p_time !~ '^\d{2}:\d{2}$' then
    return json_build_object('success', false, 'error', 'invalid_time');
  end if;
  if (p_date + p_time::time) <= (now() at time zone 'Europe/Istanbul') then
    return json_build_object('success', false, 'error', 'slot_in_past');
  end if;

  -- Limitler (mantık eskisiyle aynı)
  select * into v_settings from app_settings where id = 1 for update;
  v_week_start := date_trunc('week', p_date)::date;
  v_pt_start   := coalesce(v_settings.prime_time_start, '16:00');
  v_pt_end     := coalesce(v_settings.prime_time_end,   '20:00');
  v_is_prime   := (p_time >= v_pt_start and p_time < v_pt_end);

  if coalesce(v_settings.daily_limit, 0) > 0 then
    select count(*) into v_count from slots
    where (player1_id = v_uid or player2_id = v_uid)
      and date = p_date and not coalesce(is_admin_reserved, false);
    if v_count >= v_settings.daily_limit then
      return json_build_object('success', false, 'error', 'daily_limit_exceeded');
    end if;
  end if;

  if coalesce(v_settings.weekly_limit, 0) > 0 then
    select count(*) into v_count from slots
    where (player1_id = v_uid or player2_id = v_uid)
      and date between v_week_start and v_week_start + 6
      and not coalesce(is_admin_reserved, false);
    if v_count >= v_settings.weekly_limit then
      return json_build_object('success', false, 'error', 'weekly_limit_exceeded');
    end if;
  end if;

  if v_is_prime then
    select count(*) into v_count from slots
    where (player1_id = v_uid or player2_id = v_uid)
      and date between v_week_start and v_week_start + 6
      and time >= v_pt_start and time < v_pt_end
      and not coalesce(is_admin_reserved, false);
    if v_count >= 1 then
      return json_build_object('success', false, 'error', 'prime_time_limit_exceeded');
    end if;
  end if;

  if p2_user_id is not null then
    if coalesce(v_settings.daily_limit, 0) > 0 then
      select count(*) into v_count from slots
      where (player1_id = p2_user_id or player2_id = p2_user_id)
        and date = p_date and not coalesce(is_admin_reserved, false);
      if v_count >= v_settings.daily_limit then
        return json_build_object('success', false, 'error', 'partner_daily_limit_exceeded');
      end if;
    end if;

    if coalesce(v_settings.weekly_limit, 0) > 0 then
      select count(*) into v_count from slots
      where (player1_id = p2_user_id or player2_id = p2_user_id)
        and date between v_week_start and v_week_start + 6
        and not coalesce(is_admin_reserved, false);
      if v_count >= v_settings.weekly_limit then
        return json_build_object('success', false, 'error', 'partner_weekly_limit_exceeded');
      end if;
    end if;

    if v_is_prime then
      select count(*) into v_count from slots
      where (player1_id = p2_user_id or player2_id = p2_user_id)
        and date between v_week_start and v_week_start + 6
        and time >= v_pt_start and time < v_pt_end
        and not coalesce(is_admin_reserved, false);
      if v_count >= 1 then
        return json_build_object('success', false, 'error', 'partner_prime_time_limit_exceeded');
      end if;
    end if;
  end if;

  -- Slot: sadece var olan ve boş olan slot
  select * into v_slot from slots
  where date = p_date and time = p_time
  for update;

  if not found then
    return json_build_object('success', false, 'error', 'slot_not_found');
  end if;
  if v_slot.player1_id is not null then
    return json_build_object('success', false, 'error', 'slot_full');
  end if;

  update slots
     set player1_id = v_uid,       player1_name = v_name,
         player2_id = p2_user_id,  player2_name = v_p2_name,
         is_admin_reserved = false
   where id = v_slot.id;

  return json_build_object('success', true);
end;
$_$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id integer DEFAULT 1 NOT NULL,
    slot_start text DEFAULT '08:00'::text,
    slot_end text DEFAULT '20:00'::text,
    daily_limit integer DEFAULT 0,
    weekly_limit integer DEFAULT 0,
    prime_time_start text DEFAULT '16:00'::text,
    prime_time_end text DEFAULT '20:00'::text,
    min_cancel_hours integer DEFAULT 0,
    CONSTRAINT single_row CHECK ((id = 1))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_admin boolean DEFAULT false,
    name_changed_at timestamp with time zone
);


--
-- Name: slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    "time" text NOT NULL,
    player1_id uuid,
    player1_name text,
    created_at timestamp with time zone DEFAULT now(),
    player2_id uuid,
    player2_name text,
    is_admin_reserved boolean DEFAULT false
);


--
-- Name: app_settings app_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: slots slots_date_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_date_time_key UNIQUE (date, "time");


--
-- Name: slots slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: slots slots_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: slots slots_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.slots
    ADD CONSTRAINT slots_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: app_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: app_settings settings_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY settings_read ON public.app_settings FOR SELECT USING (true);


--
-- Name: slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

--
-- Name: slots slots_select_authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY slots_select_authenticated ON public.slots FOR SELECT TO authenticated USING (true);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION enforce_gtu_email(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.enforce_gtu_email() FROM PUBLIC;
GRANT ALL ON FUNCTION public.enforce_gtu_email() TO service_role;


--
-- Name: FUNCTION generate_slots(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.generate_slots() FROM PUBLIC;
GRANT ALL ON FUNCTION public.generate_slots() TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION reserve_slot(p_date date, p_time text, p_user_id uuid, p_user_name text, p2_user_id uuid, p2_user_name text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.reserve_slot(p_date date, p_time text, p_user_id uuid, p_user_name text, p2_user_id uuid, p2_user_name text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.reserve_slot(p_date date, p_time text, p_user_id uuid, p_user_name text, p2_user_id uuid, p2_user_name text) TO authenticated;
GRANT ALL ON FUNCTION public.reserve_slot(p_date date, p_time text, p_user_id uuid, p_user_name text, p2_user_id uuid, p2_user_name text) TO service_role;


--
-- Name: TABLE app_settings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.app_settings TO anon;
GRANT ALL ON TABLE public.app_settings TO authenticated;
GRANT ALL ON TABLE public.app_settings TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.profiles TO anon;
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE slots; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE public.slots TO anon;
GRANT ALL ON TABLE public.slots TO authenticated;
GRANT ALL ON TABLE public.slots TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--



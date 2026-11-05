import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Cached per-request — calling this multiple times in one render costs only 1 auth API call. */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/** Cached per-request — layout + pages share one profile query. */
export const getProfile = cache(async () => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, is_admin")
    .eq("id", user.id)
    .single<{ id: string; name: string; email: string; is_admin: boolean }>();
  return data;
});

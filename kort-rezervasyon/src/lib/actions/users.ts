"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/cache";

export async function searchUsers(query: string): Promise<{ id: string; name: string }[]> {
  if (query.trim().length < 2) return [];

  const user = await getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, name")
    .ilike("name", `%${query.trim()}%`)
    .neq("id", user.id)
    .limit(5);

  return (data as { id: string; name: string }[]) ?? [];
}

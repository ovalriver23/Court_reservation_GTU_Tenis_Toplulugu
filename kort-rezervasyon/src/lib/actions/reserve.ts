"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ReserveSlotResult } from "@/types";

export async function reserveSlot(
  _slotId: string,
  date: string,
  time: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapılmadı." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single<{ name: string }>();

  if (!profile) return { error: "Profil bulunamadı." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("reserve_slot", {
    p_date: date,
    p_time: time,
    p_user_id: user.id,
    p_user_name: profile.name,
  });

  if (error) return { error: error.message };

  const result = data as ReserveSlotResult;
  if (!result.success) return { error: result.error };

  return {};
}

export async function cancelSlot(
  _slotId: string,
  date: string,
  time: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapılmadı." };

  const admin = createAdminClient();

  // Verify ownership before updating
  const { data: slot } = await admin
    .from("slots")
    .select("player1_id")
    .eq("date", date)
    .eq("time", time)
    .single() as { data: { player1_id: string | null } | null };

  if (!slot) return { error: "Slot bulunamadı." };
  if (slot.player1_id !== user.id) return { error: "Bu rezervasyon size ait değil." };

  const { error } = await admin
    .from("slots")
    .update({ player1_id: null, player1_name: null })
    .eq("date", date)
    .eq("time", time);

  if (error) return { error: "İptal yapılamadı." };
  return {};
}

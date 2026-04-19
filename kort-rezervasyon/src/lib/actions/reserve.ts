"use server";

import { createClient } from "@/lib/supabase/server";
import type { ReserveSlotResult } from "@/types";

export async function reserveSlot(
  _slotId: string,
  date: string,
  time: string,
  partnerName?: string
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

  // Arkadaş adı girilmişse ikinci slotu da doldur
  if (partnerName && result.position === 1) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("slots")
      .update({ player2_id: user.id, player2_name: partnerName })
      .eq("date", date)
      .eq("time", time);
  }

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

  // Hangi player olduğunu bul
  const { data: slot } = await supabase
    .from("slots")
    .select("player1_id, player2_id")
    .eq("date", date)
    .eq("time", time)
    .single<{ player1_id: string | null; player2_id: string | null }>();

  if (!slot) return { error: "Slot bulunamadı." };

  const updateData: Record<string, null> = {};
  if (slot.player1_id === user.id) {
    updateData.player1_id = null;
    updateData.player1_name = null;
  }
  if (slot.player2_id === user.id) {
    updateData.player2_id = null;
    updateData.player2_name = null;
  }
  if (Object.keys(updateData).length === 0) {
    return { error: "Bu rezervasyon size ait değil." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("slots")
    .update(updateData)
    .eq("date", date)
    .eq("time", time);

  if (error) return { error: "İptal yapılamadı." };
  return {};
}

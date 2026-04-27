"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ReserveSlotResult } from "@/types";

export async function reserveSlot(
  _slotId: string,
  date: string,
  time: string,
  player2Id: string | null = null
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

  let player2Name: string | null = null;
  if (player2Id) {
    const admin = createAdminClient();
    const { data: p2 } = await admin
      .from("profiles")
      .select("name")
      .eq("id", player2Id)
      .single<{ name: string }>();
    if (!p2) return { error: "Seçilen kişi bulunamadı." };
    player2Name = p2.name;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("reserve_slot", {
    p_date: date,
    p_time: time,
    p_user_id: user.id,
    p_user_name: profile.name,
    p2_user_id: player2Id ?? null,
    p2_user_name: player2Name ?? null,
  });

  if (error) return { error: error.message };

  const result = data as ReserveSlotResult;
  if (!result.success) {
    if (result.error === "slot_full") return { error: "Bu saat dolu, başka bir saat seç." };
    if (result.error === "daily_limit_exceeded") return { error: "Günlük rezervasyon limitine ulaştınız." };
    if (result.error === "weekly_limit_exceeded") return { error: "Haftalık rezervasyon limitine ulaştınız." };
    if (result.error === "partner_daily_limit_exceeded") return { error: "Seçtiğin kişinin günlük rezervasyon hakkı dolmuş." };
    if (result.error === "partner_weekly_limit_exceeded") return { error: "Seçtiğin kişinin haftalık rezervasyon hakkı dolmuş." };
    if (result.error === "prime_time_limit_exceeded") return { error: "Bu haftaki prime time hakkınızı kullandınız (16:00–20:00)." };
    if (result.error === "partner_prime_time_limit_exceeded") return { error: "Seçtiğin kişinin bu haftaki prime time hakkı dolmuş." };
    return { error: result.error ?? "Rezervasyon alınamadı." };
  }

  revalidatePath("/reservations");
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

  // Player1 olarak iptal et — ikisi de temizlenir
  const { data: updated1 } = await admin
    .from("slots")
    .update({ player1_id: null, player1_name: null, player2_id: null, player2_name: null })
    .eq("date", date)
    .eq("time", time)
    .eq("player1_id", user.id)
    .select("id");

  if (updated1 && updated1.length > 0) {
    revalidatePath("/reservations");
    return {};
  }

  // Player2 olarak iptal et — ikisi de temizlenir
  const { data: updated2, error } = await admin
    .from("slots")
    .update({ player1_id: null, player1_name: null, player2_id: null, player2_name: null })
    .eq("date", date)
    .eq("time", time)
    .eq("player2_id", user.id)
    .select("id");

  if (error) return { error: `İptal yapılamadı: ${error.message}` };
  if (!updated2 || updated2.length === 0)
    return { error: "Bu rezervasyon size ait değil ya da zaten iptal edilmiş." };

  revalidatePath("/reservations");
  return {};
}

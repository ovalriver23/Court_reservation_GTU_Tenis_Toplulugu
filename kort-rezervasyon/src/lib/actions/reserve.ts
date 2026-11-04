"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { ReserveSlotResult } from "@/types";
import { slotTimeMs } from "@/lib/time";

const RESERVE_ERRORS: Record<string, string> = {
  slot_full: "Bu saat dolu, başka bir saat seç.",
  daily_limit_exceeded: "Günlük rezervasyon limitine ulaştınız.",
  weekly_limit_exceeded: "Haftalık rezervasyon limitine ulaştınız.",
  prime_time_limit_exceeded: "Bu haftaki prime time hakkınızı kullandınız.",
  partner_daily_limit_exceeded: "Seçtiğin kişinin günlük rezervasyon hakkı dolmuş.",
  partner_weekly_limit_exceeded: "Seçtiğin kişinin haftalık rezervasyon hakkı dolmuş.",
  partner_prime_time_limit_exceeded: "Seçtiğin kişinin bu haftaki prime time hakkı dolmuş.",
  not_authenticated: "Oturumun sona ermiş, lütfen tekrar giriş yap.",
  forbidden: "Bu işlem için yetkin yok.",
  profile_not_found: "Profil bulunamadı.",
  invalid_partner: "Kendini arkadaş olarak seçemezsin.",
  partner_not_found: "Seçilen kişi bulunamadı.",
  invalid_time: "Geçersiz saat.",
  slot_in_past: "Bu saat başladı ya da geçti, sayfayı yenileyip başka bir saat seç.",
  slot_not_found: "Bu saat artık mevcut değil, sayfayı yenile.",
};

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
    return { error: RESERVE_ERRORS[result.error] ?? "Rezervasyon alınamadı." };
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

  // Başlamış ya da geçmiş rezervasyon iptal edilemez (haftalık hakkı geri kazanmayı önler)
  if (slotTimeMs(date, time) <= Date.now()) {
    return { error: "Başlamış ya da geçmiş bir rezervasyon iptal edilemez." };
  }

  const admin = createAdminClient();

  const { data: settingsData } = await admin
    .from("app_settings")
    .select("min_cancel_hours")
    .eq("id", 1)
    .single<{ min_cancel_hours: number }>();

  const minCancelHours = settingsData?.min_cancel_hours ?? 0;
  if (minCancelHours > 0) {
    const diffHours = (slotTimeMs(date, time) - Date.now()) / 3600000;
    if (diffHours < minCancelHours) {
      return { error: `Randevuya ${minCancelHours} saatten az kaldığı için iptal edilemiyor.` };
    }
  }

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

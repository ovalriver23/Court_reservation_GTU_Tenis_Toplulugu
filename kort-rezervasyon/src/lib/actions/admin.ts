"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<{ is_admin: boolean }>();

  return profile?.is_admin ? user : null;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Inserts missing slots for the next 14 days within the given time range,
 * and removes empty (unbooked) slots outside that range.
 */
async function regenerateSlots(slotStart: string, slotEnd: string) {
  const admin = createAdminClient();

  const startHour = parseInt(slotStart.split(":")[0]);
  const endHour   = parseInt(slotEnd.split(":")[0]);

  // Build list of slots to insert: 14 days × hours in range
  const rows: { date: string; time: string }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = toDateStr(d);
    for (let h = startHour; h <= endHour; h++) {
      rows.push({ date, time: `${String(h).padStart(2, "0")}:00` });
    }
  }

  // Insert new slots — skip existing ones
  await admin.from("slots").upsert(rows, { onConflict: "date,time", ignoreDuplicates: true });

  const today = toDateStr(new Date());

  // Remove unbooked slots that are now before the start time
  await admin.from("slots")
    .delete()
    .is("player1_id", null)
    .gte("date", today)
    .lt("time", slotStart);

  // Remove unbooked slots that are now after the end time
  await admin.from("slots")
    .delete()
    .is("player1_id", null)
    .gte("date", today)
    .gt("time", slotEnd);
}

export async function approveUser(userId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ approved: true }).eq("id", userId);

  if (error) return { error: `Kullanıcı onaylanamadı: ${error.message}` };
  revalidatePath("/admin");
  return {};
}

export async function rejectUser(userId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) return { error: `Kullanıcı silinemedi: ${error.message}` };
  revalidatePath("/admin");
  return {};
}

export async function updateSettings(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const slot_start        = formData.get("slot_start") as string;
  const slot_end          = formData.get("slot_end") as string;
  const daily_limit       = Math.max(0, parseInt(formData.get("daily_limit") as string) || 0);
  const weekly_limit      = Math.max(0, parseInt(formData.get("weekly_limit") as string) || 0);
  const prime_time_start  = formData.get("prime_time_start") as string || "16:00";
  const prime_time_end    = formData.get("prime_time_end") as string || "20:00";

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ slot_start, slot_end, daily_limit, weekly_limit, prime_time_start, prime_time_end })
    .eq("id", 1);

  if (error) return { error: `Ayarlar kaydedilemedi: ${error.message}` };

  // Sync slots to match the new time range
  await regenerateSlots(slot_start, slot_end);

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function refreshSlots() {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("slot_start, slot_end")
    .eq("id", 1)
    .single<{ slot_start: string; slot_end: string }>();

  const slot_start = data?.slot_start ?? "08:00";
  const slot_end   = data?.slot_end   ?? "20:00";

  await regenerateSlots(slot_start, slot_end);

  revalidatePath("/");
  revalidatePath("/admin");
  return {};
}

export async function toggleAdmin(userId: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single<{ is_admin: boolean }>();

  const newIsAdmin = !profile?.is_admin;
  const { error } = await admin
    .from("profiles")
    .update({ is_admin: newIsAdmin, ...(newIsAdmin ? { approved: true } : {}) })
    .eq("id", userId);

  if (error) return { error: `Admin durumu değiştirilemedi: ${error.message}` };
  revalidatePath("/admin");
  return {};
}

export async function adminReserveSlot(date: string, time: string, name: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  if (!name.trim()) return { error: "İsim boş olamaz." };
  if (!date || !time) return { error: "Tarih ve saat gerekli." };

  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from("slots")
    .update({ player1_id: user.id, player1_name: name.trim() })
    .eq("date", date)
    .eq("time", time)
    .is("player1_id", null)
    .select("id");

  if (error) return { error: `Rezervasyon yapılamadı: ${error.message}` };
  if (!updated || updated.length === 0) return { error: "Bu slot dolu veya bulunamadı." };

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function adminReserveSlotRange(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  name: string
) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  if (!name.trim()) return { error: "İsim boş olamaz." };
  if (!startDate || !endDate || !startTime || !endTime) return { error: "Tüm alanlar gerekli." };
  if (startDate > endDate) return { error: "Başlangıç tarihi bitiş tarihinden sonra olamaz." };
  if (startTime > endTime) return { error: "Başlangıç saati bitiş saatinden sonra olamaz." };

  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from("slots")
    .update({ player1_id: user.id, player1_name: name.trim() })
    .gte("date", startDate)
    .lte("date", endDate)
    .gte("time", startTime)
    .lte("time", endTime)
    .is("player1_id", null)
    .select("id");

  if (error) return { error: `Rezervasyon yapılamadı: ${error.message}` };
  const count = updated?.length ?? 0;
  if (count === 0) return { error: "Belirtilen aralıkta boş slot bulunamadı." };

  revalidatePath("/admin");
  revalidatePath("/");
  return { count };
}

export async function adminCancelSlot(date: string, time: string) {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("slots")
    .update({ player1_id: null, player1_name: null })
    .eq("date", date)
    .eq("time", time);

  if (error) return { error: `İptal yapılamadı: ${error.message}` };
  revalidatePath("/admin");
  return {};
}

export async function sendWarningEmail(
  userId: string,
  subject: string,
  message: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await requireAdmin();
  if (!user) return { error: "Yetkisiz." };

  if (!subject.trim()) return { error: "Konu boş olamaz." };
  if (!message.trim()) return { error: "Mesaj boş olamaz." };

  const admin = createAdminClient();
  const { data: profile, error: dbError } = await admin
    .from("profiles")
    .select("email, name")
    .eq("id", userId)
    .single<{ email: string; name: string }>();

  if (dbError || !profile?.email) return { error: "Kullanıcı bulunamadı." };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GTU Tenis <noreply@gtutennis.com.tr>",
      to: [profile.email],
      subject: subject.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">
          <div style="background: #A3472E; padding: 24px 32px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px;">GTU Tenis — Yönetici Bildirimi</h2>
            <p style="color: #ffffff99; margin: 4px 0 0; font-size: 13px;">${new Date().toLocaleString("tr-TR")}</p>
          </div>
          <div style="padding: 28px 32px;">
            <p style="color: #aaaaaa; font-size: 13px; margin: 0 0 16px;">Merhaba, <span style="color: #ffffff;">${profile.name}</span></p>
            <p style="color: #ffffff; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message.trim()}</p>
          </div>
          <div style="border-top: 1px solid #333; padding: 14px 32px;">
            <p style="color: #444444; font-size: 11px; margin: 0;">GTU Tenis Topluluğu · gtutennis.com.tr</p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[sendWarningEmail] Resend error:", res.status, body);
    return { error: "E-posta gönderilemedi. Lütfen tekrar deneyin." };
  }
  return { success: true };
}

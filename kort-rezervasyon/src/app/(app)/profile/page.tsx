import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";
import PasswordChangeForm from "./PasswordChangeForm";
import NameChangeForm from "./NameChangeForm";
import { weekBoundsTR } from "@/lib/time";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { start, end } = weekBoundsTR();
  const supabaseClient = await createClient();

  const [profile, profileExtra, weekSlots, settingsRow] = await Promise.all([
    getProfile(),
    supabaseClient
      .from("profiles")
      .select("name_changed_at")
      .eq("id", user.id)
      .single<{ name_changed_at: string | null }>()
      .then(({ data }) => data),
    supabaseClient
      .from("slots")
      .select("time")
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .gte("date", start)
      .lte("date", end)
      .or("is_admin_reserved.is.null,is_admin_reserved.eq.false")
      .then(({ data }) => (data ?? []) as { time: string }[]),
    supabaseClient
      .from("app_settings")
      .select("weekly_limit, prime_time_start, prime_time_end")
      .eq("id", 1)
      .single<{ weekly_limit: number; prime_time_start: string; prime_time_end: string }>()
      .then(({ data }) => data),
  ]);

  const weeklyLimit = settingsRow?.weekly_limit ?? 0;
  const primeStart = settingsRow?.prime_time_start ?? "16:00";
  const primeEnd   = settingsRow?.prime_time_end   ?? "20:00";
  const weeklyUsed = weekSlots.length;
  const primeUsed = weekSlots.filter(s => s.time >= primeStart && s.time < primeEnd).length;

  return (
    <div className="px-4 pt-2 pb-8 space-y-4 max-w-4xl mx-auto w-full">
      <h2 className="text-text-primary font-semibold text-lg mb-2">Profil</h2>

      {/* Kullanıcı bilgileri */}
      <div className="bg-surface border border-border rounded-2xl px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-background font-bold text-lg">
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <p className="text-text-primary font-semibold">{profile?.name ?? "—"}</p>
            <p className="text-text-secondary text-sm">{profile?.email ?? user.email}</p>
          </div>
        </div>
      </div>

      {/* Bu Haftaki Durum */}
      <div className="bg-surface border border-border rounded-2xl px-4 py-4 space-y-3">
        <p className="text-text-primary font-semibold text-sm">Bu Haftaki Durum</p>

        {weeklyLimit > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Haftalık Rezervasyonlar</span>
            <span className={`text-sm font-semibold ${weeklyUsed >= weeklyLimit ? "text-red-400" : "text-primary"}`}>
              {weeklyUsed} / {weeklyLimit}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Prime Time Hakkı ({primeStart}–{primeEnd})</span>
          <span className={`text-sm font-semibold ${primeUsed >= 1 ? "text-red-400" : "text-primary"}`}>
            {primeUsed >= 1 ? "Hak doldu" : "1 hak kaldı"}
          </span>
        </div>
      </div>

      {/* İsim değiştir */}
      <NameChangeForm
        currentName={profile?.name ?? ""}
        nameChangedAt={profileExtra?.name_changed_at ?? null}
      />

      {/* Şifre değiştir */}
      <PasswordChangeForm />
    </div>
  );
}

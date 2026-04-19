import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single<{ name: string; email: string }>();

  // Haftalık kullanılan gün sayısı
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const { data: slots } = await supabase
    .from("slots")
    .select("date")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .gte("date", weekAgoStr)
    .lte("date", today);

  const usedDays = new Set((slots ?? []).map((s: { date: string }) => s.date)).size;
  const remaining = Math.max(0, 3 - usedDays);

  return (
    <div className="px-4 pt-2 pb-8">
      <h2 className="text-text-primary font-semibold text-lg mb-6">Profil</h2>

      {/* Kullanıcı Bilgileri */}
      <div className="bg-surface border border-border rounded-2xl px-4 py-4 mb-4">
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

      {/* Haftalık Hak */}
      <div className="bg-surface border border-border rounded-2xl px-4 py-4">
        <p className="text-text-secondary text-xs mb-3">Haftalık Rezervasyon Hakkı</p>
        <div className="flex gap-2 mb-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors
                ${i < usedDays ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <p className="text-text-primary text-sm">
          <span className="font-semibold">{usedDays}</span>
          <span className="text-text-secondary"> / 3 kullanıldı</span>
          {remaining > 0 && (
            <span className="text-text-secondary"> · {remaining} hak kaldı</span>
          )}
        </p>
        <p className="text-text-secondary text-xs mt-2">
          Son 7 gün içindeki rezervasyon günleri sayılır. Her gün gece yarısı hak güncellenir.
        </p>
      </div>
    </div>
  );
}

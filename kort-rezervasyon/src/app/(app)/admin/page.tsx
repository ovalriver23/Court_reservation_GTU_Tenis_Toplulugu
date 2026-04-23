export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rejectUser, adminCancelSlot, toggleAdmin } from "@/lib/actions/admin";
import SettingsForm from "@/components/SettingsForm";
import AdminReserveForm from "@/components/AdminReserveForm";
import type { Slot } from "@/types";

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const DAYS_TR   = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} — ${DAYS_TR[d.getDay()]}`;
}

function timeRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h}.${String(m).padStart(2, "0")} - ${h + 1}.${String(m).padStart(2, "0")}`;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

type User = { id: string; name: string; email: string; approved: boolean; is_admin: boolean; created_at: string };
type AppSettings = { slot_start: string; slot_end: string; daily_limit: number; weekly_limit: number; max_advance_days: number };

const TABS = [
  { key: "overview",     label: "Özet" },
  { key: "users",        label: "Üyeler" },
  { key: "reservations", label: "Rezervasyonlar" },
  { key: "manuel",       label: "Manuel" },
  { key: "settings",     label: "Ayarlar" },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: string; userId?: string };
}) {
  const tab    = searchParams?.tab    ?? "overview";
  const userId = searchParams?.userId ?? null;
  const supabase = await createClient();
  const admin    = createAdminClient();
  const today    = todayString();


  let approvedCount = 0, todayCount = 0, totalCount = 0;
  let users: User[] = [];
  let reservations: Slot[] = [];
  let settings: AppSettings = { slot_start: "08:00", slot_end: "20:00", daily_limit: 0, weekly_limit: 0, max_advance_days: 3 };
  let filterUserName: string | null = null;

  if (tab === "overview") {
    const [r1, r2, r3] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }).eq("approved", true),
      admin.from("slots").select("*", { count: "exact", head: true }).not("player1_id", "is", null).eq("date", today),
      admin.from("slots").select("*", { count: "exact", head: true }).not("player1_id", "is", null),
    ]);
    approvedCount = r1.count ?? 0;
    todayCount    = r2.count ?? 0;
    totalCount    = r3.count ?? 0;
  }

  if (tab === "users") {
    const [usersRes, slotsRes] = await Promise.all([
      admin
        .from("profiles")
        .select("id, name, email, approved, is_admin, created_at")
        .order("created_at", { ascending: false }),
      admin
        .from("slots")
        .select("player1_id")
        .not("player1_id", "is", null),
    ]);
    users = (usersRes.data as User[]) ?? [];
    const slotCounts: Record<string, number> = {};
    for (const s of (slotsRes.data ?? [])) {
      const pid = (s as { player1_id: string }).player1_id;
      slotCounts[pid] = (slotCounts[pid] ?? 0) + 1;
    }
    users = users.map(u => ({ ...u, reservationCount: slotCounts[u.id] ?? 0 } as User & { reservationCount: number }));
  }

  if (tab === "reservations" || tab === "settings" || tab === "manuel") {
    const { data } = await admin.from("app_settings").select("*").eq("id", 1).single();
    if (data) settings = data as AppSettings;
  }

  if (tab === "reservations") {
    let query = supabase
      .from("slots")
      .select("*")
      .not("player1_id", "is", null)
      .order("date")
      .order("time");

    if (userId) query = query.eq("player1_id", userId);

    const { data } = await query;
    reservations = (data as Slot[]) ?? [];

    if (userId && reservations.length > 0) {
      filterUserName = reservations[0].player1_name ?? null;
    } else if (userId) {
      const { data: p } = await admin
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .single<{ name: string }>();
      filterUserName = p?.name ?? null;
    }
  }

  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full">
      {/* Tab bar */}
      <div className="flex gap-1.5 px-4 pb-5 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
              tab === t.key
                ? "bg-primary text-background"
                : "bg-surface border border-border text-text-secondary"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="px-4 pb-8">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Toplam Üye"         value={approvedCount} />
            <StatCard label="Bugün Rezervasyon"  value={todayCount} />
            <StatCard label="Aktif Rezervasyon"  value={totalCount} />
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div className="flex flex-col gap-3">
            {users.length === 0 ? (
              <p className="text-text-secondary text-sm text-center pt-4">Kayıtlı üye yok.</p>
            ) : (users as (User & { reservationCount: number })[]).map(u => (
              <div key={u.id} className="bg-surface border border-border rounded-2xl px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-text-primary font-semibold truncate">{u.name}</p>
                      {u.is_admin && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex-shrink-0">
                          Admin
                        </span>
                      )}
                      {(u as User & { reservationCount: number }).reservationCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-border/40 text-text-secondary flex-shrink-0">
                          {(u as User & { reservationCount: number }).reservationCount} rezervasyon
                        </span>
                      )}
                    </div>
                    <p className="text-text-secondary text-xs mt-0.5 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {(u as User & { reservationCount: number }).reservationCount > 0 && (
                        <Link
                          href={`/admin?tab=reservations&userId=${u.id}`}
                          className="px-3 py-1.5 border border-border text-text-secondary text-xs rounded-xl active:scale-95 transition-transform"
                        >
                          Gör
                        </Link>
                      )}
                      <form action={async () => { "use server"; await toggleAdmin(u.id); }}>
                        <button type="submit" className="px-3 py-1.5 border border-border text-text-secondary text-xs rounded-xl active:scale-95 transition-transform">
                          {u.is_admin ? "Admin Kaldır" : "Admin Yap"}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await rejectUser(u.id); }}>
                        <button type="submit" className="px-3 py-1.5 border border-border text-red-400 text-xs rounded-xl active:scale-95 transition-transform">
                          {u.approved ? "Sil" : "Reddet"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MANUEL */}
        {tab === "manuel" && (
          <AdminReserveForm slotStart={settings.slot_start} slotEnd={settings.slot_end} />
        )}

        {/* RESERVATIONS */}
        {tab === "reservations" && (
          <div className="flex flex-col gap-3">
            {userId && (
              <div className="flex items-center justify-between bg-surface border border-primary/30 rounded-xl px-4 py-2.5">
                <p className="text-text-secondary text-xs">
                  Filtre: <span className="text-text-primary font-medium">{filterUserName ?? "Kullanıcı"}</span>
                </p>
                <Link href="/admin?tab=reservations" className="text-primary text-xs underline underline-offset-2">
                  Tümünü Göster
                </Link>
              </div>
            )}

            {reservations.length === 0 ? (
              <p className="text-text-secondary text-sm text-center pt-4">Aktif rezervasyon yok.</p>
            ) : reservations.map(slot => (
              <div key={slot.id} className="bg-surface border border-primary/30 rounded-2xl px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold truncate">{slot.player1_name}</p>
                    <p className="text-text-secondary text-xs mt-0.5">
                      {timeRange(slot.time)} — {formatDate(slot.date)}
                    </p>
                  </div>
                  <form action={async () => { "use server"; await adminCancelSlot(slot.date, slot.time); }}>
                    <button type="submit" className="px-3 py-1.5 border border-border text-text-secondary text-sm rounded-xl transition-transform active:scale-95 flex-shrink-0">
                      İptal
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && <SettingsForm settings={settings} />}

      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-surface border rounded-2xl px-4 py-5 ${highlight ? "border-primary/50" : "border-border"}`}>
      <p className={`text-3xl font-bold tracking-tight ${highlight ? "text-primary" : "text-text-primary"}`}>
        {value}
      </p>
      <p className="text-text-secondary text-xs mt-1 leading-tight">{label}</p>
    </div>
  );
}

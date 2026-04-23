import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/cache";
import { cancelSlot } from "@/lib/actions/reserve";
import type { Slot } from "@/types";

const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const DAYS_TR = ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()} — ${DAYS_TR[d.getDay()]}`;
}

function timeRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${time}-${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function ReservationsPage() {
  const user = await getUser();
  if (!user) return null;

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data } = await supabase
    .from("slots")
    .select("*")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .gte("date", today)
    .order("date")
    .order("time");

  const reservations = (data as Slot[]) ?? [];

  return (
    <div className="px-4 pt-2 pb-8">
      <h2 className="text-text-primary font-semibold text-lg mb-4">Rezervasyonlarım</h2>

      {reservations.length === 0 ? (
        <div className="text-center pt-12">
          <p className="text-text-secondary text-sm">Aktif rezervasyonun yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservations.map((slot) => {
            const isPlayer1 = slot.player1_id === user.id;
            const partners = isPlayer1
              ? slot.player2_name
              : slot.player1_name;

            return (
              <div key={slot.id} className="bg-surface border border-primary/30 rounded-2xl px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold text-base">{timeRange(slot.time)}</p>
                    <p className="text-text-secondary text-xs mt-0.5">{formatDate(slot.date)}</p>
                    {partners && (
                      <p className="text-text-secondary text-xs mt-1">
                        {isPlayer1 ? "Arkadaş:" : "Rezervasyon sahibi:"}{" "}
                        <span className="text-white/70">{partners}</span>
                      </p>
                    )}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await cancelSlot(slot.id, slot.date, slot.time);
                      revalidatePath("/reservations");
                    }}
                  >
                    <button
                      type="submit"
                      className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95 shrink-0"
                    >
                      İptal
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

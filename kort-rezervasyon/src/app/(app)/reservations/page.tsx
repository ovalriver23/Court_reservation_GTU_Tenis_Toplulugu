import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/cache";
import { cancelSlot } from "@/lib/actions/reserve";
import type { Slot } from "@/types";

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()} — ${DAYS_TR[d.getDay()]}`;
}

function timeRange(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h}.${String(m).padStart(2, "0")} - ${h + 1}.${String(m).padStart(2, "0")}`;
}

function isPastReservation(slotDate: string, slotTime: string): boolean {
  return new Date(`${slotDate}T${slotTime}:00`) < new Date();
}

export default async function ReservationsPage() {
  const user = await getUser();
  if (!user) return null;
  const userId = user.id;

  const supabase = await createClient();
  const { data } = await supabase
    .from("slots")
    .select("*")
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .order("date")
    .order("time");

  const reservations = (data as Slot[]) ?? [];
  const activeReservations = reservations.filter(slot => !isPastReservation(slot.date, slot.time));
  const pastReservations = reservations.filter(slot => isPastReservation(slot.date, slot.time));

  function renderReservation(slot: Slot, showCancel: boolean) {
    const isPlayer1 = slot.player1_id === userId;
    const partners = isPlayer1 ? slot.player2_name : slot.player1_name;

    return (
      <div key={slot.id} className="bg-surface border border-primary/30 rounded-2xl px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-text-primary font-semibold text-base">{timeRange(slot.time)}</p>
            <p className="text-text-secondary text-xs mt-0.5">{formatDate(slot.date)}</p>
            {partners && (
              <p className="text-text-secondary text-xs mt-1">
                {isPlayer1 ? "Arkadaş:" : "Rezervasyon sahibi:"} <span className="text-white/70">{partners}</span>
              </p>
            )}
          </div>
          {showCancel && (
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-8 max-w-4xl mx-auto w-full">
      <h2 className="text-text-primary font-semibold text-lg mb-4">Rezervasyonlarım</h2>

      {reservations.length === 0 ? (
        <div className="text-center pt-12">
          <p className="text-text-secondary text-sm">Rezervasyonun yok.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-text-primary font-medium text-sm">Aktif Rezervasyonlar</h3>
              <span className="text-text-secondary text-xs">{activeReservations.length}</span>
            </div>

            {activeReservations.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6 bg-surface border border-border rounded-2xl">
                Aktif rezervasyonun yok.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {activeReservations.map(slot => renderReservation(slot, true))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-text-primary font-medium text-sm">Geçmiş Rezervasyonlar</h3>
              <span className="text-text-secondary text-xs">{pastReservations.length}</span>
            </div>

            {pastReservations.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-6 bg-surface border border-border rounded-2xl">
                Geçmiş rezervasyonun yok.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {pastReservations.map(slot => renderReservation(slot, false))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

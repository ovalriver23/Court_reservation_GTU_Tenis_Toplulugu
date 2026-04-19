import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cancelSlot } from "@/lib/actions/reserve";
import type { Slot } from "@/types";

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getDate()} ${["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][d.getMonth()]} ${d.getFullYear()} — ${DAYS_TR[d.getDay()]}`;
}

export default async function ReservationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const { data } = await supabase
    .from("slots")
    .select("*")
    .eq("player1_id", user.id)
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
          {reservations.map((slot) => (
            <div
              key={slot.id}
              className="bg-surface border border-primary/30 rounded-2xl px-4 py-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-primary font-semibold text-base">{slot.time}</p>
                  <p className="text-text-secondary text-xs mt-0.5">{formatDate(slot.date)}</p>
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
                    className="text-sm px-4 py-1.5 rounded-xl border border-border text-text-secondary transition-all active:scale-95"
                  >
                    İptal
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

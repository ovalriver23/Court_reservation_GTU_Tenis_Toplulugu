"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import WeekCalendar from "@/components/WeekCalendar";
import SlotCard from "@/components/SlotCard";
import { createClient } from "@/lib/supabase/client";
import { reserveSlot, cancelSlot } from "@/lib/actions/reserve";
import type { Slot } from "@/types";

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function filterVisibleSlots(slots: Slot[], date: string, settings: AppSettings | null): Slot[] {
  let filtered = slots;

  if (settings) {
    filtered = filtered.filter(s => s.time >= settings.slot_start && s.time <= settings.slot_end);
  }

  // Sadece bugünün geçmiş saatlerini gizle; advance-lock slotları SlotCard'da göster
  const todayStr = todayString();
  if (date === todayStr) {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    filtered = filtered.filter((s) => {
      const [sh, sm] = s.time.split(":").map(Number);
      return sh > h || (sh === h && sm >= m);
    });
  }

  return filtered;
}

type AppSettings = { slot_start: string; slot_end: string; min_advance_hours: number };

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
    supabase.from("app_settings").select("slot_start, slot_end, min_advance_hours").eq("id", 1).single()
      .then(({ data }) => { if (data) setSettings(data as AppSettings); });
  }, []);

  const fetchSlots = useCallback(async (date: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("slots")
      .select("*")
      .eq("date", date)
      .order("time");
    setSlots((data as Slot[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  useEffect(() => {
    const channel = supabase
      .channel(`slots-${selectedDate}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "slots", filter: `date=eq.${selectedDate}` },
        () => fetchSlots(selectedDate)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedDate, fetchSlots]);

  const handleReserve = useCallback(async (
    slotId: string, date: string, time: string
  ) => {
    const result = await reserveSlot(slotId, date, time);
    return result;
  }, []);

  const handleCancel = useCallback(async (
    slotId: string, date: string, time: string
  ) => {
    const result = await cancelSlot(slotId, date, time);
    return result;
  }, []);

  const visibleSlots = useMemo(
    () => filterVisibleSlots(slots, selectedDate, settings),
    [slots, selectedDate, settings]
  );

  const minAdvanceHours = settings?.min_advance_hours ?? 0;

  return (
    <div className="flex flex-col h-full">
      <div className="pt-4 pb-3">
        <div className="px-4 max-w-4xl mx-auto">
          <WeekCalendar selected={selectedDate} onChange={setSelectedDate} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="px-4 max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center pt-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleSlots.length === 0 ? (
            <div className="text-center pt-12">
              <p className="text-text-secondary text-sm">Bu gün için uygun slot yok.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleSlots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  currentUserId={userId}
                  minAdvanceHours={minAdvanceHours}
                  onReserve={handleReserve}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

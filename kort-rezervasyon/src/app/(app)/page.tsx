"use client";

import { useEffect, useState, useCallback } from "react";
import WeekCalendar from "@/components/WeekCalendar";
import SlotCard from "@/components/SlotCard";
import { createClient } from "@/lib/supabase/client";
import { reserveSlot, cancelSlot } from "@/lib/actions/reserve";
import type { Slot } from "@/types";

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function filterVisibleSlots(slots: Slot[], date: string): Slot[] {
  const todayStr = todayString();
  return slots.filter((s) => s.date >= todayStr);
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
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
  }, []);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  // Realtime subscription
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

  // Rezervasyon: server action çağır, sonra hemen refresh
  const handleReserve = useCallback(async (
    slotId: string, date: string, time: string, partnerName?: string
  ) => {
    const result = await reserveSlot(slotId, date, time, partnerName);
    if (!result.error) fetchSlots(selectedDate);
    return result;
  }, [selectedDate, fetchSlots]);

  // İptal: server action çağır, sonra hemen refresh
  const handleCancel = useCallback(async (
    slotId: string, date: string, time: string
  ) => {
    const result = await cancelSlot(slotId, date, time);
    if (!result.error) fetchSlots(selectedDate);
    return result;
  }, [selectedDate, fetchSlots]);

  const visibleSlots = filterVisibleSlots(slots, selectedDate);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <WeekCalendar selected={selectedDate} onChange={setSelectedDate} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
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
                onReserve={handleReserve}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

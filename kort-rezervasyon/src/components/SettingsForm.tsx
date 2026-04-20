"use client";

import { useState } from "react";
import { updateSettings, refreshSlots } from "@/lib/actions/admin";

const HOURS = Array.from({ length: 17 }, (_, i) =>
  `${String(i + 6).padStart(2, "0")}:00`
);

type AppSettings = {
  slot_start: string;
  slot_end: string;
  daily_limit: number;
  weekly_limit: number;
};

export default function SettingsForm({ settings }: { settings: AppSettings }) {
  const [saving, setSaving]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateSettings(formData);
    setSaving(false);
    if (result?.error) setError(result.error);
    else setSaved(true);
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    const result = await refreshSlots();
    setRefreshing(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Court hours */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-5">
          <p className="text-text-primary font-semibold text-sm mb-1">Kort Saatleri</p>
          <p className="text-text-secondary text-xs mb-4">
            Değiştirilince slot aralığı otomatik güncellenir.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-text-secondary text-xs mb-1.5">Açılış</label>
              <select
                name="slot_start"
                defaultValue={settings.slot_start}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              >
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-text-secondary text-xs mb-1.5">Kapanış</label>
              <select
                name="slot_end"
                defaultValue={settings.slot_end}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              >
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-5">
          <p className="text-text-primary font-semibold text-sm mb-1">Rezervasyon Limitleri</p>
          <p className="text-text-secondary text-xs mb-4">0 = sınırsız</p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-text-secondary text-xs mb-1.5">Günlük Limit</label>
              <input
                type="number"
                name="daily_limit"
                defaultValue={settings.daily_limit}
                min={0}
                max={10}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-text-secondary text-xs mb-1.5">Haftalık Limit</label>
              <input
                type="number"
                name="weekly_limit"
                defaultValue={settings.weekly_limit}
                min={0}
                max={14}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-text-primary text-sm"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && <p className="text-primary text-sm font-medium">Ayarlar kaydedildi, slotlar güncellendi.</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-background font-semibold py-3 rounded-xl transition-transform active:scale-95 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      {/* Manual slot refresh */}
      <div className="bg-surface border border-border rounded-2xl px-4 py-4">
        <p className="text-text-primary font-semibold text-sm mb-1">Slotları Manuel Güncelle</p>
        <p className="text-text-secondary text-xs mb-4">
          Eksik slotlar varsa mevcut ayarlara göre sonraki 14 günü yeniden oluşturur.
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full border border-border text-text-secondary font-medium py-2.5 rounded-xl transition-transform active:scale-95 disabled:opacity-50 text-sm"
        >
          {refreshing ? "Güncelleniyor..." : "Slotları Yenile"}
        </button>
      </div>
    </div>
  );
}

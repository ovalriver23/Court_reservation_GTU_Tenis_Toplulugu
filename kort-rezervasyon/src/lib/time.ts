/**
 * Türkiye saatiyle tarih/saat yardımcıları.
 *
 * Sunucu (Vercel) UTC'de çalıştığı için `new Date("2026-11-07T17:00:00")` gibi
 * ifadeler sunucuda 3 saat kayar. Bu dosyadaki fonksiyonlar her ortamda
 * Türkiye saatine göre hesaplar. Türkiye 2016'dan beri kalıcı olarak UTC+3;
 * yaz saati uygulaması yok.
 */
const TR_TIME_ZONE = "Europe/Istanbul";
const TR_OFFSET = "+03:00";

/** "YYYY-MM-DD" + "HH:MM" → Türkiye saatine göre o anın zaman damgası (ms). */
export function slotTimeMs(date: string, time: string): number {
  return new Date(`${date}T${time}:00${TR_OFFSET}`).getTime();
}

/** Türkiye'de bugünün tarihi, "YYYY-MM-DD". */
export function todayTR(): string {
  // en-CA biçimi doğrudan YYYY-MM-DD verir
  return new Intl.DateTimeFormat("en-CA", { timeZone: TR_TIME_ZONE }).format(new Date());
}

/** "YYYY-MM-DD" tarihine gün ekler (negatif de olabilir). */
export function addDaysTR(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Türkiye'ye göre bu haftanın Pazartesi ve Pazar tarihleri. */
export function weekBoundsTR(): { start: string; end: string } {
  const today = todayTR();
  const [y, m, d] = today.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Paz, 1=Pzt, ..., 6=Cmt
  const start = addDaysTR(today, day === 0 ? -6 : 1 - day);
  return { start, end: addDaysTR(start, 6) };
}

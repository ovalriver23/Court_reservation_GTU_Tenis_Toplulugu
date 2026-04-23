"use client";

const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function getDates(maxDays: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= maxDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

interface WeekCalendarProps {
  selected: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  maxAdvanceDays?: number;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeekCalendar({ selected, onChange, maxAdvanceDays = 14 }: WeekCalendarProps) {
  const dates = getDates(maxAdvanceDays);

  return (
    <div className="overflow-x-auto pb-1 scrollbar-none">
      <div className="flex gap-2 min-w-full w-max justify-center">
      {dates.map((d) => {
        const key = toDateString(d);
        const isSelected = key === selected;
        const isToday = key === toDateString(new Date());

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-3 rounded-2xl border transition-all active:scale-95
              ${isSelected
                ? "bg-primary border-primary text-background"
                : "bg-surface border-border text-text-primary"
              }`}
          >
            <span className={`text-xs mb-1 ${isSelected ? "text-background" : "text-text-secondary"}`}>
              {DAYS_TR[d.getDay()]}
            </span>
            <span className="text-lg font-semibold leading-none">{d.getDate()}</span>
            <span className={`text-xs mt-1 ${isSelected ? "text-background" : "text-text-secondary"}`}>
              {MONTHS_TR[d.getMonth()]}
            </span>
            {isToday && !isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}

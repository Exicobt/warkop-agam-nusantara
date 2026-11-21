"use client";

import { Segmented } from "@/components/dashboard/ui";
import { addDays, endOfDay, fromInputDate, startOfDay, toInputDate } from "@/lib/format";

export const RANGE_PRESETS = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari" },
  { value: "30d", label: "30 hari" },
  { value: "month", label: "Bulan ini" },
  { value: "custom", label: "Kustom" },
];

export const initialRange = (preset = "7d") => {
  const today = toInputDate(new Date());
  return { preset, from: today, to: today };
};

/** Ubah state kontrol menjadi { from: Date, to: Date } (batas hari penuh, waktu lokal). */
export function resolveRange({ preset, from, to }, now = new Date()) {
  const today = startOfDay(now);
  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(now) };
    case "7d":
      return { from: addDays(today, -6), to: endOfDay(now) };
    case "30d":
      return { from: addDays(today, -29), to: endOfDay(now) };
    case "month":
      return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: endOfDay(now) };
    default: {
      const f = fromInputDate(from);
      const t = fromInputDate(to);
      return f <= t ? { from: startOfDay(f), to: endOfDay(t) } : { from: startOfDay(t), to: endOfDay(f) };
    }
  }
}

export default function DateRange({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        value={value.preset}
        onChange={(preset) => onChange({ ...value, preset })}
        options={RANGE_PRESETS}
      />
      {value.preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from}
            max={toInputDate(new Date())}
            onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })}
            className="field w-auto py-1.5 text-xs"
            aria-label="Dari tanggal"
          />
          <span className="text-xs text-gray-400">s/d</span>
          <input
            type="date"
            value={value.to}
            max={toInputDate(new Date())}
            onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })}
            className="field w-auto py-1.5 text-xs"
            aria-label="Sampai tanggal"
          />
        </div>
      )}
    </div>
  );
}

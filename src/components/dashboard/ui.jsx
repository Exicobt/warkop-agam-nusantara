"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusMeta } from "@/lib/format";

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, subtitle, action, children, className, bodyClassName }) {
  return (
    <section className={cn("surface", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Perubahan vs periode sebelumnya. `change` = persen atau null. */
export function DeltaBadge({ change, suffix = "vs kemarin", invert = false }) {
  if (change === null || change === undefined) {
    return <span className="text-xs text-gray-400">Belum ada pembanding</span>;
  }
  const rounded = Math.round(change * 10) / 10;
  const up = rounded > 0;
  const flat = rounded === 0;
  const good = invert ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
          flat ? "bg-gray-100 text-gray-500" : good ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
        )}
      >
        <Icon className="h-3 w-3" />
        {Math.abs(rounded)}%
      </span>
      <span className="text-gray-400">{suffix}</span>
    </span>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "brand", children }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };
  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 place-items-center rounded-xl", tones[tone])}>
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-gray-900 tabular-nums">{value}</p>
      <div className="mt-2 min-h-5">{children ?? (hint && <p className="text-xs text-gray-500">{hint}</p>)}</div>
    </div>
  );
}

export function StatusBadge({ status, className }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        meta.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cn("inline-flex rounded-xl bg-gray-100 p-1", className)} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition",
            value === opt.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gray-100 text-gray-400">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-gray-500">{description}</p>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200/70", className)} />;
}

/** Bar horizontal sederhana untuk daftar peringkat. */
export function RankBar({ label, value, max, right, sub }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-gray-800">{label}</span>
        <span className="shrink-0 text-xs font-semibold text-gray-700 tabular-nums">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      {sub && <p className="mt-1 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

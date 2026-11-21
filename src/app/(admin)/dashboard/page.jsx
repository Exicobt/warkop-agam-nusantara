"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  Armchair,
  Clock,
  Receipt,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  DeltaBadge,
  EmptyState,
  PageHeader,
  RankBar,
  Segmented,
  Skeleton,
  StatCard,
  StatusBadge,
} from "@/components/dashboard/ui";
import {
  byCategory,
  byHour,
  byPayment,
  byType,
  delta,
  inRange,
  revenueByDay,
  summarize,
  topMenus,
} from "@/lib/analytics";
import {
  addDays,
  endOfDay,
  formatCompactRupiah,
  formatDate,
  formatNumber,
  formatRupiah,
  formatTime,
  startOfDay,
  tableLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const FETCH_DAYS = 60; // cukup untuk membandingkan 30 hari terakhir vs 30 hari sebelumnya
const POLL_MS = 60000;
const PIE_COLORS = ["#c05a14", "#3f8f6b", "#3b6ea5", "#d9a21c", "#8a5a9e"];
const BRAND = "#c05a14";

const PERIODS = [
  { value: 7, label: "7 hari" },
  { value: 14, label: "14 hari" },
  { value: 30, label: "30 hari" },
];

const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #e9e4dc",
    boxShadow: "0 8px 24px rgba(28,24,21,0.08)",
    fontSize: 12,
  },
};

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [asOf, setAsOf] = useState(() => new Date());
  const [period, setPeriod] = useState(7);
  const [freeing, setFreeing] = useState(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const from = addDays(startOfDay(new Date()), -(FETCH_DAYS - 1));
      const [ordersRes, tablesRes] = await Promise.all([
        fetch(`/api/orders?status=all&from=${encodeURIComponent(from.toISOString())}`),
        fetch("/api/table"),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }
      if (tablesRes.ok) {
        const data = await tablesRes.json();
        setTables(Array.isArray(data) ? data : []);
      }
      setAsOf(new Date());
      if (manual && !ordersRes.ok) toast.error("Gagal memuat data pesanan");
    } catch (error) {
      console.error(error);
      if (manual) toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const freeTable = async (table) => {
    setFreeing(table.id);
    try {
      const res = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: table.id, status: "available", action: "update" }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Meja ${table.table_number} dikosongkan`);
      load();
    } catch {
      toast.error("Gagal mengubah status meja");
    } finally {
      setFreeing(null);
    }
  };

  const m = useMemo(() => {
    const today = startOfDay(asOf);
    const yesterday = addDays(today, -1);
    const todaySum = summarize(inRange(orders, today, endOfDay(asOf)));
    const yesterdaySum = summarize(inRange(orders, yesterday, endOfDay(yesterday)));

    const curFrom = addDays(today, -(period - 1));
    const prevFrom = addDays(today, -(period * 2 - 1));
    const prevTo = endOfDay(addDays(today, -period));
    const cur = inRange(orders, curFrom, endOfDay(asOf));
    const prev = inRange(orders, prevFrom, prevTo);
    const curSum = summarize(cur);
    const prevSum = summarize(prev);

    const hours = byHour(cur);
    const peak = hours.reduce((a, b) => (b.transactions > a.transactions ? b : a), hours[0]);
    const active = orders.filter((o) => ["pending", "waiting", "preparing", "done"].includes(o.status));

    return {
      todaySum,
      yesterdaySum,
      curSum,
      prevSum,
      trend: revenueByDay(cur, curFrom, today),
      hours,
      peak,
      categories: byCategory(cur),
      payments: byPayment(cur),
      types: byType(cur),
      menus: topMenus(cur, 5),
      active,
      activeBy: {
        pending: active.filter((o) => o.status === "pending").length,
        waiting: active.filter((o) => o.status === "waiting").length,
        preparing: active.filter((o) => o.status === "preparing").length,
        done: active.filter((o) => o.status === "done").length,
      },
      recent: orders.slice(0, 8),
    };
  }, [orders, asOf, period]);

  const occupied = tables.filter((t) => t.status === "occupied").length;
  const categoryTotal = m.categories.reduce((s, c) => s + c.revenue, 0);
  const typeTotal = m.types.reduce((s, t) => s + t.revenue, 0);
  const paymentTotal = m.payments.reduce((s, p) => s + p.revenue, 0);
  const hasTrend = m.trend.some((d) => d.revenue > 0);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${formatDate(asOf, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · diperbarui ${formatTime(asOf)}`}
        actions={
          <>
            <Segmented value={period} onChange={setPeriod} options={PERIODS} />
            <button onClick={() => load(true)} disabled={refreshing} className="btn-soft py-2" aria-label="Segarkan data">
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </>
        }
      />

      {/* KPI hari ini */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Omzet hari ini" value={formatRupiah(m.todaySum.revenue)} icon={Wallet} tone="brand">
          <DeltaBadge change={delta(m.todaySum.revenue, m.yesterdaySum.revenue)} />
        </StatCard>
        <StatCard label="Transaksi lunas" value={formatNumber(m.todaySum.transactions)} icon={ShoppingBag} tone="emerald">
          <DeltaBadge change={delta(m.todaySum.transactions, m.yesterdaySum.transactions)} />
        </StatCard>
        <StatCard label="Rata-rata / pesanan" value={formatRupiah(m.todaySum.aov)} icon={Receipt} tone="sky">
          <DeltaBadge change={delta(m.todaySum.aov, m.yesterdaySum.aov)} />
        </StatCard>
        <StatCard label="Pesanan aktif" value={formatNumber(m.active.length)} icon={Activity} tone="violet">
          <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700">{m.activeBy.pending} kasir</span>
            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-sky-700">{m.activeBy.waiting} antre</span>
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-violet-700">{m.activeBy.preparing} masak</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700">{m.activeBy.done} siap</span>
          </div>
        </StatCard>
        <StatCard
          label="Meja terisi"
          value={`${occupied} / ${tables.length}`}
          icon={Armchair}
          tone="amber"
          hint={tables.length ? `${Math.round((occupied / tables.length) * 100)}% okupansi` : "Belum ada meja"}
        />
      </div>

      {/* Tren + kategori */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Tren omzet"
          subtitle={`${period} hari terakhir · pesanan lunas`}
          action={
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-gray-900">{formatRupiah(m.curSum.revenue)}</p>
              <DeltaBadge change={delta(m.curSum.revenue, m.prevSum.revenue)} suffix={`vs ${period} hari sebelumnya`} />
            </div>
          }
        >
          <div className="h-72">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={m.trend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece6dd" />
                  <XAxis
                    dataKey={period === 7 ? "weekday" : "label"}
                    stroke="#a8a094"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={period === 30 ? 3 : 0}
                  />
                  <YAxis
                    stroke="#a8a094"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tickFormatter={formatCompactRupiah}
                  />
                  <Tooltip
                    {...chartTooltip}
                    formatter={(v) => [formatRupiah(v), "Omzet"]}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.key ?? ""}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} fill="url(#trendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={TrendingUp} title="Belum ada transaksi lunas" description="Grafik muncul setelah ada pesanan yang selesai dibayar pada periode ini." />
            )}
          </div>
        </Card>

        <Card title="Penjualan per kategori" subtitle={`${period} hari terakhir`}>
          {categoryTotal > 0 ? (
            <div>
              <div className="relative mx-auto h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={m.categories} dataKey="revenue" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={2} stroke="none">
                      {m.categories.map((c, i) => (
                        <Cell key={c.key} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltip} formatter={(v) => formatRupiah(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-[11px] text-gray-400">Total</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCompactRupiah(categoryTotal)}</p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {m.categories.map((c, i) => (
                  <li key={c.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-gray-500">
                      <span className="font-semibold text-gray-900">{Math.round((c.revenue / categoryTotal) * 100)}%</span>
                      <span className="ml-2 text-xs">{formatNumber(c.qty)} porsi</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState icon={ShoppingBag} title="Belum ada data" />
          )}
        </Card>
      </div>

      {/* Jam sibuk + menu terlaris + pembayaran */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Jam sibuk"
          subtitle={m.peak?.transactions ? `Puncak pukul ${m.peak.label}.00 · ${m.peak.transactions} transaksi` : "Distribusi transaksi per jam"}
        >
          <div className="h-56">
            {m.peak?.transactions ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.hours} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece6dd" />
                  <XAxis dataKey="label" stroke="#a8a094" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                  <YAxis stroke="#a8a094" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    {...chartTooltip}
                    cursor={{ fill: "#f4f1ec" }}
                    formatter={(v) => [v, "Transaksi"]}
                    labelFormatter={(l) => `Pukul ${l}.00`}
                  />
                  <Bar dataKey="transactions" radius={[4, 4, 0, 0]}>
                    {m.hours.map((h) => (
                      <Cell key={h.hour} fill={h.hour === m.peak.hour ? BRAND : "#ecb06f"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Clock} title="Belum ada data" />
            )}
          </div>
        </Card>

        <Card title="Menu terlaris" subtitle={`Berdasarkan porsi · ${period} hari`}>
          {m.menus.length ? (
            <div className="space-y-4">
              {m.menus.map((menu) => (
                <RankBar
                  key={menu.name}
                  label={menu.name}
                  value={menu.qty}
                  max={m.menus[0].qty}
                  right={`${formatNumber(menu.qty)} porsi`}
                  sub={formatRupiah(menu.revenue)}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={ShoppingBag} title="Belum ada penjualan" />
          )}
        </Card>

        <Card title="Metode & tipe pesanan" subtitle={`Komposisi omzet · ${period} hari`}>
          {paymentTotal > 0 ? (
            <div className="space-y-6">
              <div>
                <p className="eyebrow mb-3">Metode pembayaran</p>
                <div className="space-y-3.5">
                  {m.payments.map((p) => (
                    <RankBar
                      key={p.name}
                      label={p.name}
                      value={p.revenue}
                      max={paymentTotal}
                      right={`${Math.round((p.revenue / paymentTotal) * 100)}%`}
                      sub={`${p.transactions} transaksi · ${formatRupiah(p.revenue)}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-3">Tipe pesanan</p>
                <div className="space-y-3.5">
                  {m.types.map((t) => (
                    <RankBar
                      key={t.key}
                      label={t.name}
                      value={t.revenue}
                      max={typeTotal}
                      right={typeTotal ? `${Math.round((t.revenue / typeTotal) * 100)}%` : "0%"}
                      sub={`${t.transactions} transaksi`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Wallet} title="Belum ada data" />
          )}
        </Card>
      </div>

      {/* Meja + transaksi terbaru */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Monitor meja"
          subtitle={`${occupied} terisi · ${tables.length - occupied} lainnya`}
          action={
            <Link href="/dashboard/table" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              Kelola <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {tables.length ? (
            <div className="grid grid-cols-3 gap-2.5">
              {tables.map((t) => {
                const isOcc = t.status === "occupied";
                const isOff = t.status === "not_available";
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "rounded-xl border p-3 text-center",
                      isOcc ? "border-brand-200 bg-brand-50" : isOff ? "border-gray-200 bg-gray-100" : "border-emerald-200 bg-emerald-50/60"
                    )}
                  >
                    <p className="text-xs text-gray-500">Meja</p>
                    <p className="text-lg font-semibold leading-tight text-gray-900">{t.table_number}</p>
                    <p className={cn("mt-0.5 text-[11px] font-medium", isOcc ? "text-brand-700" : isOff ? "text-gray-500" : "text-emerald-700")}>
                      {isOcc ? "Terisi" : isOff ? "Nonaktif" : "Kosong"}
                    </p>
                    {isOcc && (
                      <button
                        onClick={() => freeTable(t)}
                        disabled={freeing === t.id}
                        className="mt-2 w-full rounded-lg bg-white py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100 disabled:opacity-50"
                      >
                        {freeing === t.id ? "…" : "Kosongkan"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Armchair} title="Belum ada meja" />
          )}
        </Card>

        <Card
          className="xl:col-span-2"
          bodyClassName="px-0 pb-2 pt-3"
          title="Transaksi terbaru"
          action={
            <Link href="/dashboard/history" className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {m.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-2 font-medium">Order</th>
                    <th className="px-2 py-2 font-medium">Pelanggan</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {m.recent.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/70">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">#{o.id}</p>
                        <p className="text-xs text-gray-400">{formatTime(o.create_at)}</p>
                      </td>
                      <td className="px-2 py-3">
                        <p className="text-gray-800">{o.customers?.name || "Guest"}</p>
                        <p className="text-xs text-gray-400">{tableLabel(o)}</p>
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-gray-900">{formatRupiah(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Receipt} title="Belum ada transaksi" />
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-72" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}

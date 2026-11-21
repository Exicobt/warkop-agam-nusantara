"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Ban, Download, FileSpreadsheet, Loader2, Package, Printer, Receipt, ShoppingBag, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DateRange, { initialRange, resolveRange } from "@/components/dashboard/DateRange";
import { Card, EmptyState, PageHeader, RankBar, Segmented, StatCard } from "@/components/dashboard/ui";
import { byCategory, byPayment, revenueByDay, summarize, topMenus } from "@/lib/analytics";
import {
  CATEGORY_LABEL,
  dateKey,
  downloadCsv,
  formatCompactRupiah,
  formatDate,
  formatNumber,
  formatRupiah,
  formatTime,
  statusMeta,
  tableLabel,
} from "@/lib/format";

const MAX_ROWS = 5000;

export default function LaporanPage() {
  const [range, setRange] = useState(() => initialRange("7d"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuSort, setMenuSort] = useState("qty");

  const { from, to } = useMemo(() => resolveRange(range), [range]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ status: "all", from: from.toISOString(), to: to.toISOString() });
      const res = await fetch(`/api/orders?${qs}`);
      if (!res.ok) throw new Error(res.status === 401 ? "Sesi berakhir, silakan login ulang." : "Gagal memuat laporan.");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const report = useMemo(() => {
    const menus = topMenus(orders, 0);
    const revenue = menus.reduce((s, m) => s + m.revenue, 0);
    return {
      sum: summarize(orders),
      daily: revenueByDay(orders, from, to),
      menus: [...menus].sort((a, b) => (menuSort === "qty" ? b.qty - a.qty : b.revenue - a.revenue)),
      menuRevenue: revenue,
      categories: byCategory(orders),
      payments: byPayment(orders),
    };
  }, [orders, from, to, menuSort]);

  const label = `${formatDate(from)} – ${formatDate(to)}`;
  const fileTag = `${dateKey(from)}_${dateKey(to)}`;
  const dayCount = report.daily.length;
  const chartData = report.daily.map((d) => ({ ...d, tick: dayCount <= 7 ? d.weekday : d.label }));

  const exportDaily = () =>
    downloadCsv(`laporan-harian_${fileTag}.csv`, [
      ["Tanggal", "Transaksi lunas", "Item terjual", "Omzet (Rp)", "Dibatalkan"],
      ...report.daily.map((d) => [d.key, d.transactions, d.items, d.revenue, d.cancelled]),
      ["TOTAL", report.sum.transactions, report.sum.items, report.sum.revenue, report.sum.cancelled],
    ]);

  const exportMenus = () =>
    downloadCsv(`penjualan-menu_${fileTag}.csv`, [
      ["Peringkat", "Menu", "Kategori", "Porsi", "Omzet (Rp)", "Kontribusi (%)"],
      ...report.menus.map((m, i) => [
        i + 1,
        m.name,
        CATEGORY_LABEL[m.kategori] || m.kategori || "-",
        m.qty,
        m.revenue,
        report.menuRevenue ? ((m.revenue / report.menuRevenue) * 100).toFixed(1) : 0,
      ]),
    ]);

  const exportTransactions = () =>
    downloadCsv(`transaksi_${fileTag}.csv`, [
      ["No. Order", "Tanggal", "Jam", "Pelanggan", "Meja / Tipe", "Status", "Metode bayar", "Item", "Total (Rp)"],
      ...orders.map((o) => [
        o.id,
        dateKey(o.create_at),
        formatTime(o.create_at),
        o.customers?.name || "Guest",
        tableLabel(o),
        statusMeta(o.status).label,
        o.payment_method?.name || "-",
        (o.orders || []).map((i) => `${i.menu?.nama || "Menu dihapus"} x${i.qty}`).join("; "),
        o.total,
      ]),
    ]);

  const guard = (fn) => () => (orders.length ? fn() : toast.error("Tidak ada data untuk diekspor"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Penjualan"
        description={`Periode ${label} · omzet dihitung dari pesanan yang sudah dibayar`}
        className="print:hidden"
        actions={
          <>
            <button onClick={guard(exportTransactions)} className="btn-soft py-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Ekspor transaksi</span>
            </button>
            <button onClick={() => window.print()} className="btn-primary py-2">
              <Printer className="h-4 w-4" />
              Cetak
            </button>
          </>
        }
      />

      {/* Judul khusus cetak */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold">Laporan Penjualan — Warkop Agam Nusantara</h1>
        <p className="text-sm text-gray-600">Periode {label}</p>
      </div>

      <div className="print:hidden">
        <DateRange value={range} onChange={setRange} />
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button onClick={load} className="font-semibold underline">Coba lagi</button>
        </div>
      )}
      {orders.length >= MAX_ROWS && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Data dibatasi {formatNumber(MAX_ROWS)} pesanan terbaru. Persempit periode agar laporan lengkap.
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
            <StatCard label="Omzet" value={formatRupiah(report.sum.revenue)} icon={Wallet} tone="brand" />
            <StatCard label="Transaksi lunas" value={formatNumber(report.sum.transactions)} icon={Receipt} tone="emerald" />
            <StatCard label="Item terjual" value={formatNumber(report.sum.items)} icon={Package} tone="sky" />
            <StatCard label="Rata-rata / pesanan" value={formatRupiah(report.sum.aov)} icon={ShoppingBag} tone="violet" />
            <StatCard
              label="Dibatalkan"
              value={formatNumber(report.sum.cancelled)}
              icon={Ban}
              tone="rose"
              hint={`${report.sum.cancelRate.toFixed(1)}% dari ${formatNumber(report.sum.total)} pesanan`}
            />
          </div>

          <Card title="Omzet harian" subtitle={label}>
            <div className="h-64">
              {report.sum.revenue > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece6dd" />
                    <XAxis dataKey="tick" stroke="#a8a094" fontSize={11} tickLine={false} axisLine={false} interval={dayCount > 14 ? Math.ceil(dayCount / 10) : 0} />
                    <YAxis stroke="#a8a094" fontSize={11} tickLine={false} axisLine={false} width={56} tickFormatter={formatCompactRupiah} />
                    <Tooltip
                      cursor={{ fill: "#f4f1ec" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e9e4dc", fontSize: 12 }}
                      formatter={(v) => [formatRupiah(v), "Omzet"]}
                      labelFormatter={(_, p) => p?.[0]?.payload?.key ?? ""}
                    />
                    <Bar dataKey="revenue" fill="#c05a14" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={Wallet} title="Tidak ada penjualan lunas pada periode ini" />
              )}
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card
              className="xl:col-span-2"
              bodyClassName="px-0 pb-2 pt-3"
              title="Penjualan per menu"
              subtitle={`${report.menus.length} menu terjual`}
              action={
                <div className="flex items-center gap-2 print:hidden">
                  <Segmented
                    value={menuSort}
                    onChange={setMenuSort}
                    options={[
                      { value: "qty", label: "Porsi" },
                      { value: "revenue", label: "Omzet" },
                    ]}
                  />
                  <button onClick={guard(exportMenus)} className="btn-soft px-3 py-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </button>
                </div>
              }
            >
              {report.menus.length ? (
                <div className="max-h-[480px] overflow-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-2 font-medium">#</th>
                        <th className="px-2 py-2 font-medium">Menu</th>
                        <th className="px-2 py-2 text-right font-medium">Porsi</th>
                        <th className="px-2 py-2 text-right font-medium">Omzet</th>
                        <th className="px-5 py-2 text-right font-medium">Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.menus.map((m, i) => (
                        <tr key={m.name} className="hover:bg-gray-50/70">
                          <td className="px-5 py-2.5 text-gray-400 tabular-nums">{i + 1}</td>
                          <td className="px-2 py-2.5">
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-400">{CATEGORY_LABEL[m.kategori] || "—"}</p>
                          </td>
                          <td className="px-2 py-2.5 text-right tabular-nums">{formatNumber(m.qty)}</td>
                          <td className="px-2 py-2.5 text-right font-medium tabular-nums">{formatRupiah(m.revenue)}</td>
                          <td className="px-5 py-2.5 text-right tabular-nums text-gray-500">
                            {report.menuRevenue ? ((m.revenue / report.menuRevenue) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={ShoppingBag} title="Belum ada menu terjual" />
              )}
            </Card>

            <div className="space-y-6">
              <Card title="Per kategori">
                {report.categories.length ? (
                  <div className="space-y-4">
                    {report.categories.map((c) => (
                      <RankBar key={c.key} label={c.name} value={c.revenue} max={report.categories[0].revenue} right={formatRupiah(c.revenue)} sub={`${formatNumber(c.qty)} porsi`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Belum ada data" />
                )}
              </Card>
              <Card title="Per metode pembayaran">
                {report.payments.length ? (
                  <div className="space-y-4">
                    {report.payments.map((p) => (
                      <RankBar key={p.name} label={p.name} value={p.revenue} max={report.payments[0].revenue} right={formatRupiah(p.revenue)} sub={`${p.transactions} transaksi`} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Belum ada data" />
                )}
              </Card>
            </div>
          </div>

          <Card
            bodyClassName="px-0 pb-2 pt-3"
            title="Rekap harian"
            action={
              <button onClick={guard(exportDaily)} className="btn-soft px-3 py-1.5 text-xs print:hidden">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            }
          >
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-2 font-medium">Tanggal</th>
                    <th className="px-2 py-2 text-right font-medium">Transaksi</th>
                    <th className="px-2 py-2 text-right font-medium">Item</th>
                    <th className="px-2 py-2 text-right font-medium">Batal</th>
                    <th className="px-5 py-2 text-right font-medium">Omzet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...report.daily].reverse().map((d) => (
                    <tr key={d.key} className={d.transactions ? "hover:bg-gray-50/70" : "text-gray-400"}>
                      <td className="px-5 py-2.5">{formatDate(d.key + "T00:00:00", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{d.transactions}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{d.items}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{d.cancelled}</td>
                      <td className="px-5 py-2.5 text-right font-medium tabular-nums">{formatRupiah(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="px-5 py-3">Total</td>
                    <td className="px-2 py-3 text-right tabular-nums">{report.sum.transactions}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{report.sum.items}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{report.sum.cancelled}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatRupiah(report.sum.revenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

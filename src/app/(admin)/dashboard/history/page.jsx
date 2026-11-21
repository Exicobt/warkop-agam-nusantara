"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, Receipt, Search, X } from "lucide-react";
import DateRange, { initialRange, resolveRange } from "@/components/dashboard/DateRange";
import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/ui";
import {
  STATUS_META,
  dateKey,
  downloadCsv,
  formatDateTime,
  formatNumber,
  formatRupiah,
  formatTime,
  statusMeta,
  tableLabel,
} from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;
const FILTERS = ["all", "pending", "waiting", "preparing", "done", "finish", "cancelled"];

export default function HistoryPage() {
  const [range, setRange] = useState(() => initialRange("30d"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

  const { from, to } = useMemo(() => resolveRange(range), [range]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ status: "all", from: from.toISOString(), to: to.toISOString() });
      const res = await fetch(`/api/orders?${qs}`);
      if (!res.ok) throw new Error(res.status === 401 ? "Sesi berakhir, silakan login ulang." : "Gagal memuat riwayat.");
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

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        String(o.id) === q ||
        (o.customers?.name || "").toLowerCase().includes(q) ||
        tableLabel(o).toLowerCase().includes(q) ||
        (o.orders || []).some((i) => (i.menu?.nama || "").toLowerCase().includes(q))
      );
    });
  }, [orders, status, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const filteredRevenue = filtered.filter((o) => o.status === "finish").reduce((s, o) => s + (o.total || 0), 0);

  const exportCsv = () =>
    downloadCsv(`riwayat-transaksi_${dateKey(from)}_${dateKey(to)}.csv`, [
      ["No. Order", "Tanggal", "Jam", "Pelanggan", "Meja / Tipe", "Status", "Metode bayar", "Item", "Total (Rp)"],
      ...filtered.map((o) => [
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Transaksi"
        description="Telusuri seluruh pesanan, cari berdasarkan nama, nomor order, meja, atau menu."
        actions={
          <button onClick={exportCsv} disabled={!filtered.length} className="btn-soft py-2">
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
        }
      />

      <DateRange
        value={range}
        onChange={(v) => {
          setRange(v);
          setPage(1);
        }}
      />

      <div className="surface overflow-hidden">
        {/* Toolbar */}
        <div className="space-y-3 border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari #order, pelanggan, meja, menu…"
              className="field pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setStatus(f);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition",
                  status === f
                    ? "bg-gray-900 text-white ring-gray-900"
                    : "bg-white text-gray-600 ring-gray-200 hover:bg-gray-50"
                )}
              >
                {f === "all" ? "Semua" : STATUS_META[f].label}
                <span className={cn("ml-1.5 tabular-nums", status === f ? "text-gray-300" : "text-gray-400")}>
                  {counts[f] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <div className="grid place-items-center py-20 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Receipt} title="Tidak ada transaksi" description="Ubah filter, kata kunci, atau rentang tanggal." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-gray-50/70 text-left text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-3 py-3 font-medium">Pelanggan</th>
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((o) => (
                  <tr key={o.id} onClick={() => setDetail(o)} className="cursor-pointer hover:bg-gray-50/70">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">#{o.id}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(o.create_at)}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-gray-800">{o.customers?.name || "Guest"}</p>
                      <p className="text-xs text-gray-400">{tableLabel(o)}</p>
                    </td>
                    <td className="max-w-[260px] px-3 py-3.5">
                      <p className="truncate text-gray-600">
                        {(o.orders || []).map((i) => `${i.qty}× ${i.menu?.nama || "Item dihapus"}`).join(", ")}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-gray-900">
                      {formatRupiah(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            <p>
              {formatNumber(filtered.length)} transaksi · omzet lunas{" "}
              <b className="text-gray-800">{formatRupiah(filteredRevenue)}</b>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage <= 1}
                aria-label="Halaman sebelumnya"
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="tabular-nums">
                {safePage} / {pages}
              </span>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= pages}
                aria-label="Halaman berikutnya"
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail */}
      {detail && (
        <div
          className="fixed inset-0 z-[60] grid place-items-end bg-black/50 backdrop-blur-sm animate-fade-in sm:place-items-center sm:p-4"
          onClick={() => setDetail(null)}
        >
          <div
            role="dialog"
            aria-label={`Detail order ${detail.id}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 p-5">
              <div>
                <p className="eyebrow">Order</p>
                <h3 className="text-xl font-semibold text-gray-900">#{detail.id}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(detail.create_at)}</p>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Tutup" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={detail.status} />
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{tableLabel(detail)}</span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {detail.tipe_order === "take_away" ? "Take away" : "Dine in"}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Pelanggan</dt>
                  <dd className="font-medium text-gray-800">{detail.customers?.name || "Guest"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Metode bayar</dt>
                  <dd className="font-medium text-gray-800">{detail.payment_method?.name || "—"}</dd>
                </div>
              </dl>
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {detail.orders.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="text-gray-800">
                      <b className="mr-1.5 text-brand-700">{i.qty}×</b>
                      {i.menu?.nama || "Item dihapus"}
                    </span>
                    <span className="tabular-nums text-gray-600">{formatRupiah(i.total)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-semibold tabular-nums text-gray-900">{formatRupiah(detail.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

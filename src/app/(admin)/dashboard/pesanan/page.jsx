"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, BellRing, Check, ChefHat, Clock, Hourglass, Inbox, Loader2, RefreshCw, Timer, X } from "lucide-react";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/dashboard/ui";
import { formatElapsed, formatRupiah, formatTime, minutesSince, tableLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const POLL_MS = 10000;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const LATE_MINUTES = 20;

const COLUMNS = [
  { status: "pending", title: "Menunggu kasir", icon: Inbox, accent: "bg-amber-100 text-amber-700" },
  { status: "waiting", title: "Antre dapur", icon: Hourglass, accent: "bg-sky-100 text-sky-700" },
  { status: "preparing", title: "Dimasak", icon: ChefHat, accent: "bg-violet-100 text-violet-700" },
  { status: "done", title: "Siap disajikan", icon: BellRing, accent: "bg-emerald-100 text-emerald-700" },
];

const ACTIVE = COLUMNS.map((c) => c.status);

export default function PesananPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState({});
  const busyRef = useRef(new Set());

  const load = useCallback(async () => {
    setSyncing(true);
    try {
      const from = new Date(Date.now() - LOOKBACK_MS).toISOString();
      const res = await fetch(`/api/orders?status=all&from=${encodeURIComponent(from)}`, { cache: "no-store" });
      if (res.status === 401) throw new Error("Sesi berakhir, silakan login ulang.");
      if (!res.ok) throw new Error("Gagal memuat pesanan.");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
      setLoaded(true);
    } catch (err) {
      setError(err.message || "Koneksi bermasalah.");
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  const act = async (order, status, message) => {
    if (busyRef.current.has(order.id)) return;
    busyRef.current.add(order.id);
    setBusy((b) => ({ ...b, [order.id]: true }));
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basket_id: order.id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status.");
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      busyRef.current.delete(order.id);
      setBusy((b) => ({ ...b, [order.id]: false }));
      load();
    }
  };

  const confirmCancel = (order) => {
    if (window.confirm(`Batalkan pesanan #${order.id}? Tindakan ini tidak dapat diurungkan.`)) {
      act(order, "cancelled", `Pesanan #${order.id} dibatalkan`);
    }
  };

  const { grouped, stats } = useMemo(() => {
    const active = orders
      .filter((o) => ACTIVE.includes(o.status))
      .sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
    const inKitchen = active.filter((o) => ["pending", "waiting", "preparing"].includes(o.status));
    const waits = inKitchen.map((o) => minutesSince(o.create_at, now));
    const oldest = inKitchen[0];
    return {
      grouped: Object.fromEntries(COLUMNS.map((c) => [c.status, active.filter((o) => o.status === c.status)])),
      stats: {
        total: active.length,
        avgWait: waits.length ? Math.round(waits.reduce((a, b) => a + b, 0) / waits.length) : 0,
        oldest,
        late: waits.filter((w) => w >= LATE_MINUTES).length,
      },
    };
  }, [orders, now]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitor Pesanan"
        description="Pantau seluruh antrean secara langsung. Diperbarui otomatis setiap 10 detik."
        actions={
          <button onClick={load} disabled={syncing} className="btn-soft py-2">
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            Segarkan
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Pesanan aktif" value={stats.total} icon={Inbox} tone="violet" />
        <StatCard label="Rata-rata menunggu" value={`${stats.avgWait} mnt`} icon={Timer} tone="sky" hint="Belum disajikan" />
        <StatCard
          label="Terlama"
          value={stats.oldest ? formatElapsed(stats.oldest.create_at, now) : "—"}
          icon={Clock}
          tone="amber"
          hint={stats.oldest ? `Order #${stats.oldest.id}` : "Tidak ada antrean"}
        />
        <StatCard
          label={`Terlambat (>${LATE_MINUTES} mnt)`}
          value={stats.late}
          icon={AlertTriangle}
          tone={stats.late ? "rose" : "emerald"}
          hint={stats.late ? "Perlu perhatian" : "Semua dalam batas wajar"}
        />
      </div>

      {!loaded ? (
        <div className="grid place-items-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => (
            <section key={col.status} className="flex flex-col rounded-2xl bg-gray-100/80 p-3">
              <header className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("grid h-7 w-7 place-items-center rounded-lg", col.accent)}>
                    <col.icon className="h-4 w-4" />
                  </span>
                  <h2 className="text-sm font-semibold text-gray-800">{col.title}</h2>
                </div>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white px-2 text-xs font-bold text-gray-600 tabular-nums">
                  {grouped[col.status].length}
                </span>
              </header>

              <div className="flex flex-col gap-3">
                {grouped[col.status].length === 0 ? (
                  <EmptyState title="Kosong" className="py-8" />
                ) : (
                  grouped[col.status].map((o) => {
                    const waited = minutesSince(o.create_at, now);
                    const late = col.status !== "done" && waited >= LATE_MINUTES;
                    return (
                      <article
                        key={o.id}
                        className={cn("rounded-xl border bg-white p-3.5 shadow-sm", late ? "border-rose-300" : "border-gray-200")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              #{o.id} <span className="ml-1 text-xs font-medium text-gray-500">{tableLabel(o)}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              {o.customers?.name || "Guest"} · {formatTime(o.create_at)}
                            </p>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", late ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-600")}>
                            {formatElapsed(o.create_at, now)}
                          </span>
                        </div>
                        <p className="mt-2.5 text-xs leading-relaxed text-gray-600">
                          {o.orders.map((i) => `${i.qty}× ${i.menu?.nama || "Item dihapus"}`).join(" · ")}
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-gray-900">{formatRupiah(o.total)}</p>

                        {(col.status === "pending" || col.status === "waiting") && (
                          <div className="mt-3 flex gap-2">
                            {col.status === "pending" && (
                              <button
                                onClick={() => act(o, "waiting", `Pesanan #${o.id} diteruskan ke dapur`)}
                                disabled={!!busy[o.id]}
                                className="btn flex-1 bg-brand-600 py-2 text-xs text-white hover:bg-brand-700"
                              >
                                <Check className="h-3.5 w-3.5" /> Terima
                              </button>
                            )}
                            <button
                              onClick={() => confirmCancel(o)}
                              disabled={!!busy[o.id]}
                              className="btn flex-1 border border-rose-200 bg-white py-2 text-xs text-rose-600 hover:bg-rose-50"
                            >
                              <X className="h-3.5 w-3.5" /> {col.status === "pending" ? "Tolak" : "Batalkan"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      <Card bodyClassName="py-3" className="bg-gray-50/50">
        <p className="text-xs text-gray-500">
          Dapur memproses status <b>Antre → Dimasak → Siap</b> dari layar dapur; kasir menandai <b>Selesai</b> setelah pembayaran.
          Dari halaman ini admin dapat menerima atau membatalkan pesanan yang belum dimasak.
        </p>
      </Card>
    </div>
  );
}

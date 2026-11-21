"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ChefHat,
  Clock,
  Hourglass,
  Loader2,
  LogIn,
  RefreshCw,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  WifiOff,
} from "lucide-react";
import Navbar from "../components/navbar";
import { cn } from "@/lib/utils";
import { formatElapsed, formatTime, minutesSince, tableLabel } from "@/lib/format";

const POLL_MS = 8000;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;

const COLUMNS = [
  {
    status: "waiting",
    title: "Antre",
    hint: "Belum dimasak",
    icon: Hourglass,
    accent: "text-sky-700 bg-sky-100",
    action: { label: "Mulai Masak", next: "preparing", icon: ChefHat, className: "bg-sky-600 hover:bg-sky-700" },
  },
  {
    status: "preparing",
    title: "Dimasak",
    hint: "Sedang dikerjakan",
    icon: ChefHat,
    accent: "text-violet-700 bg-violet-100",
    action: {
      label: "Siap Disajikan",
      next: "done",
      icon: CheckCircle2,
      className: "bg-emerald-600 hover:bg-emerald-700",
      confirm: true,
    },
  },
  {
    status: "done",
    title: "Siap Disajikan",
    hint: "Menunggu kasir",
    icon: BellRing,
    accent: "text-emerald-700 bg-emerald-100",
    action: null,
  },
];

const isToday = (value) => new Date(value).toDateString() === new Date().toDateString();

export default function DapurPage() {
  const [orders, setOrders] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [busyIds, setBusyIds] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [soundOn, setSoundOn] = useState(false);

  const busyRef = useRef(new Set());
  const knownWaiting = useRef(null);
  const audioRef = useRef(null);
  const soundRef = useRef(false);
  const confirmTimer = useRef(null);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  const beep = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      /* audio tidak tersedia: abaikan */
    }
  }, []);

  const toggleSound = () => {
    if (!soundOn) {
      // AudioContext baru boleh dibuat/di-resume setelah interaksi pengguna.
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioRef.current ||= new Ctx();
        audioRef.current.resume?.();
      }
    }
    setSoundOn((v) => !v);
  };

  const fetchOrders = useCallback(async () => {
    setSyncing(true);
    try {
      const from = new Date(Date.now() - LOOKBACK_MS).toISOString();
      const res = await fetch(`/api/orders?status=all&from=${encodeURIComponent(from)}`, {
        cache: "no-store",
      });

      if (res.status === 401) {
        // Dulu error ini ditelan diam-diam sehingga layar tampak "hidup"
        // padahal semua aksi gagal. Sekarang ditampilkan jelas.
        setSessionExpired(true);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const incoming = Array.isArray(data) ? data : [];

      setSessionExpired(false);
      setOffline(false);
      setOrders((prev) => {
        // Pesanan yang sedang diproses (optimistic) jangan ditimpa data polling lama.
        const local = new Map(prev.map((o) => [o.id, o]));
        return incoming.map((o) => (busyRef.current.has(o.id) && local.has(o.id) ? local.get(o.id) : o));
      });

      // Bunyi + toast untuk pesanan antre yang baru masuk
      const waitingIds = new Set(incoming.filter((o) => o.status === "waiting").map((o) => o.id));
      if (knownWaiting.current) {
        const fresh = [...waitingIds].filter((id) => !knownWaiting.current.has(id));
        if (fresh.length) {
          toast(`Pesanan baru masuk: #${fresh.join(", #")}`, { icon: "🔔" });
          if (soundRef.current) beep();
        }
      }
      knownWaiting.current = waitingIds;
      setLoaded(true);
    } catch (error) {
      console.error("Gagal memuat pesanan:", error);
      setOffline(true);
    } finally {
      setSyncing(false);
    }
  }, [beep]);

  useEffect(() => {
    fetchOrders();
    const poll = setInterval(fetchOrders, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const onVisible = () => document.visibilityState === "visible" && fetchOrders();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", fetchOrders);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", fetchOrders);
      clearTimeout(confirmTimer.current);
    };
  }, [fetchOrders]);

  const setBusy = (id, value) => {
    if (value) busyRef.current.add(id);
    else busyRef.current.delete(id);
    setBusyIds((prev) => ({ ...prev, [id]: value }));
  };

  const patchLocal = (id, status) =>
    setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));

  const advance = async (order, action) => {
    if (busyRef.current.has(order.id)) return;

    // Langkah konfirmasi inline (pengganti modal) untuk aksi yang tak bisa dibatalkan.
    if (action.confirm && confirmId !== order.id) {
      setConfirmId(order.id);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 3500);
      return;
    }
    setConfirmId(null);

    setBusy(order.id, true);
    patchLocal(order.id, action.next); // optimistic
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basket_id: order.id, status: action.next }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setSessionExpired(true);
        throw new Error("Sesi login berakhir. Silakan login ulang.");
      }
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status pesanan.");

      toast.success(
        action.next === "preparing" ? `Order #${order.id} mulai dimasak` : `Order #${order.id} siap disajikan`
      );
    } catch (error) {
      patchLocal(order.id, order.status); // rollback
      toast.error(error.message || "Gagal mengubah status pesanan.");
    } finally {
      setBusy(order.id, false);
      fetchOrders();
    }
  };

  const { byStatus, pendingCount, finishedToday } = useMemo(() => {
    const sorted = [...orders].sort((a, b) => new Date(a.create_at) - new Date(b.create_at));
    return {
      byStatus: {
        waiting: sorted.filter((o) => o.status === "waiting"),
        preparing: sorted.filter((o) => o.status === "preparing"),
        done: sorted.filter((o) => o.status === "done"),
      },
      pendingCount: orders.filter((o) => o.status === "pending").length,
      finishedToday: orders.filter((o) => o.status === "finish" && isToday(o.create_at)).length,
    };
  }, [orders]);

  const activeCount = byStatus.waiting.length + byStatus.preparing.length;

  return (
    <div className="min-h-screen">
      <Navbar />

      {sessionExpired && (
        <div className="border-b border-rose-200 bg-rose-50">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="flex items-center gap-2 text-sm font-medium text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              Sesi login berakhir — status pesanan tidak bisa diubah sampai login ulang.
            </p>
            <Link href="/" className="btn bg-rose-600 py-2 text-white hover:bg-rose-700">
              <LogIn className="h-4 w-4" />
              Login ulang
            </Link>
          </div>
        </div>
      )}
      {offline && !sessionExpired && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2.5 text-sm font-medium text-amber-800 sm:px-6">
            <WifiOff className="h-4 w-4" />
            Koneksi terputus — mencoba menyambung kembali…
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        {/* Ringkasan */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="sky" label="Antre" value={byStatus.waiting.length} />
            <Pill tone="violet" label="Dimasak" value={byStatus.preparing.length} />
            <Pill tone="emerald" label="Siap" value={byStatus.done.length} />
            <Pill tone="stone" label="Selesai hari ini" value={finishedToday} />
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount} pesanan menunggu konfirmasi kasir
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={cn(
                "btn border py-2",
                soundOn
                  ? "border-brand-200 bg-brand-50 text-brand-800"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              )}
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {soundOn ? "Suara aktif" : "Aktifkan suara"}
            </button>
            <button onClick={fetchOrders} disabled={syncing} className="btn-soft py-2">
              <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>

        {!loaded ? (
          <div className="grid place-items-center py-24 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {activeCount === 0 && byStatus.done.length === 0 && (
              <div className="surface mb-5 flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-400">
                  <UtensilsCrossed className="h-7 w-7" />
                </span>
                <p className="text-base font-semibold text-gray-800">Belum ada pesanan</p>
                <p className="mt-1 text-sm text-gray-500">
                  Pesanan baru muncul di sini setelah kasir menerimanya.
                </p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-3">
              {COLUMNS.map((col) => (
                <section key={col.status} className="flex min-h-[200px] flex-col rounded-2xl bg-gray-200/50 p-3">
                  <header className="mb-3 flex items-center justify-between px-1.5 pt-1">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("grid h-8 w-8 place-items-center rounded-lg", col.accent)}>
                        <col.icon className="h-4 w-4" />
                      </span>
                      <div className="leading-tight">
                        <h2 className="text-sm font-semibold text-gray-900">{col.title}</h2>
                        <p className="text-[11px] text-gray-500">{col.hint}</p>
                      </div>
                    </div>
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 text-xs font-bold text-gray-700 tabular-nums">
                      {byStatus[col.status].length}
                    </span>
                  </header>

                  <div className="flex flex-1 flex-col gap-3">
                    {byStatus[col.status].length === 0 ? (
                      <p className="m-auto py-8 text-xs text-gray-400">Kosong</p>
                    ) : (
                      byStatus[col.status].map((order) => (
                        <Ticket
                          key={order.id}
                          order={order}
                          column={col}
                          now={now}
                          busy={!!busyIds[order.id]}
                          confirming={confirmId === order.id}
                          onAdvance={advance}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Pill({ label, value, tone }) {
  const tones = {
    sky: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
    emerald: "bg-emerald-100 text-emerald-800",
    stone: "bg-white text-gray-600 ring-1 ring-gray-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium", tones[tone])}>
      {label}
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </span>
  );
}

function Ticket({ order, column, now, busy, confirming, onAdvance }) {
  const waited = minutesSince(order.create_at, now);
  const urgent = column.status !== "done" && waited >= 20;
  const warn = column.status !== "done" && waited >= 10 && !urgent;
  const action = column.action;

  return (
    <article
      className={cn(
        "animate-rise rounded-xl border bg-white p-4 shadow-sm transition",
        urgent ? "border-rose-300 ring-2 ring-rose-100" : warn ? "border-amber-300" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight text-gray-900">#{order.id}</h3>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
              {tableLabel(order)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {order.customers?.name || "Guest"} · masuk {formatTime(order.create_at)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
            urgent
              ? "bg-rose-100 text-rose-700"
              : warn
              ? "bg-amber-100 text-amber-800"
              : "bg-gray-100 text-gray-600"
          )}
        >
          <Clock className="h-3 w-3" />
          {formatElapsed(order.create_at, now)}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {order.orders.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2">
            <span className="grid h-7 min-w-7 place-items-center rounded-md bg-brand-50 px-1.5 text-sm font-bold text-brand-700 tabular-nums">
              {item.qty}×
            </span>
            <span className="text-sm font-medium text-gray-800">{item.menu?.nama || "Item dihapus"}</span>
          </li>
        ))}
      </ul>

      {action ? (
        <button
          onClick={() => onAdvance(order, action)}
          disabled={busy}
          className={cn(
            "btn mt-3 w-full py-3 text-white",
            confirming ? "bg-gray-900 hover:bg-gray-800" : action.className
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <action.icon className="h-4 w-4" />
          )}
          {busy ? "Menyimpan…" : confirming ? "Ketuk lagi untuk konfirmasi" : action.label}
        </button>
      ) : (
        <p className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2.5 text-xs font-medium text-emerald-700">
          <BellRing className="h-3.5 w-3.5" />
          Siap — tunggu kasir mengambil
        </p>
      )}
    </article>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  AlertTriangle,
  Bell,
  BellRing,
  ChevronDown,
  Info,
  Loader2,
  LogOut,
  Menu as MenuIcon,
  Receipt,
  Search,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL, formatRupiah } from "@/lib/format";
import { NAV_GROUPS, isActivePath } from "../Sidebar";

const NOTIF_POLL_MS = 30000;

function usePageTitle() {
  const pathname = usePathname();
  for (const group of NAV_GROUPS) {
    const hit = group.items.find((item) => isActivePath(pathname, item));
    if (hit) return hit.label;
  }
  return "Dashboard";
}

const Navbar = ({ onMenuClick }) => {
  const title = usePageTitle();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [showUser, setShowUser] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch (error) {
      console.error("Gagal ambil notifikasi:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, NOTIF_POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  const performSearch = useCallback(async (keyword) => {
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResults(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) performSearch(query.trim());
      else setResults(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    const onDown = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  const unread = notifications.filter((n) => !readIds.has(n.id));
  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 backdrop-blur print:hidden">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            onClick={onMenuClick}
            aria-label="Buka menu"
            className="-ml-1 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <h2 className="hidden text-sm font-semibold text-gray-900 sm:block">{title}</h2>

          {/* Pencarian */}
          <div ref={searchRef} className="relative ml-auto w-full max-w-sm sm:ml-6 sm:flex-1">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results && setShowResults(true)}
                placeholder="Cari menu atau nama pelanggan…"
                className="field rounded-xl border-transparent bg-gray-100 py-2 pl-9 pr-9 focus:bg-white"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                  }}
                  aria-label="Hapus pencarian"
                  className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showResults && results && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-xl">
                {!results.menus?.length && !results.orders?.length && (
                  <p className="px-4 py-6 text-center text-sm text-gray-500">
                    Tidak ada hasil untuk &quot;{query}&quot;
                  </p>
                )}
                {results.menus?.length > 0 && (
                  <div>
                    <p className="eyebrow px-4 pb-1 pt-1">Menu</p>
                    {results.menus.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => {
                          setShowResults(false);
                          setQuery("");
                          setSelectedMenu(menu);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
                          <Utensils className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-medium text-gray-800">{menu.nama}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.orders?.length > 0 && (
                  <div className="mt-1">
                    <p className="eyebrow px-4 pb-1 pt-2">Transaksi</p>
                    {results.orders.map((order) => (
                      <a
                        key={order.id}
                        href="/dashboard/history"
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-700">
                          <Receipt className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-gray-800">
                            {order.customers?.name || "Guest"}
                          </span>
                          <span className="block text-xs text-gray-500">
                            Order #{order.id} · {order.status}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Notifikasi */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotif((v) => !v)}
                aria-label="Notifikasi"
                className={cn(
                  "relative rounded-xl p-2.5 transition",
                  showNotif ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Bell className="h-5 w-5" />
                {unread.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unread.length > 9 ? "9+" : unread.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900">Notifikasi</h3>
                    {unread.length > 0 && (
                      <button onClick={markAllRead} className="text-xs font-medium text-brand-700 hover:underline">
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-gray-400">Belum ada notifikasi.</p>
                    ) : (
                      notifications.map((n) => {
                        const isRead = readIds.has(n.id);
                        return (
                          <div
                            key={n.id}
                            className={cn(
                              "flex gap-3 border-b border-gray-50 px-4 py-3 last:border-0",
                              !isRead && "bg-brand-50/40"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                                n.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                              )}
                            >
                              {n.type === "warning" ? <AlertTriangle className="h-4 w-4" /> : n.title === "Pesanan Masuk" ? <BellRing className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className={cn("text-sm", isRead ? "text-gray-700" : "font-semibold text-gray-900")}>
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{n.message}</p>
                              <p className="mt-1 text-[11px] text-gray-400">{n.time}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Akun */}
            <div ref={userRef} className="relative">
              <button
                onClick={() => setShowUser((v) => !v)}
                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-gray-100"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
                  A
                </span>
                <span className="hidden text-sm font-medium text-gray-700 sm:block">Admin</span>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
              </button>
              {showUser && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl animate-fade-in">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {selectedMenu && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedMenu(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={selectedMenu.nama}
          >
            <div className="relative h-48 bg-gray-100">
              {selectedMenu.gambar && (
                <Image src={selectedMenu.gambar} alt={selectedMenu.nama} fill unoptimized className="object-cover" />
              )}
              <button
                onClick={() => setSelectedMenu(null)}
                aria-label="Tutup"
                className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-gray-700 shadow hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="eyebrow">{CATEGORY_LABEL[selectedMenu.kategori] || selectedMenu.kategori}</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{selectedMenu.nama}</h3>
              <p className="mt-1 text-xl font-semibold text-brand-700">{formatRupiah(selectedMenu.harga)}</p>
              <a href="/dashboard/menu" className="btn-primary mt-4 w-full">
                Kelola di halaman Menu
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

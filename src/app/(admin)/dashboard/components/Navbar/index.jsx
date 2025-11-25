"use client";

import { Menu, Bell, Search, Store, ChevronDown, Utensils, User, Loader2, X, Receipt, Tag, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
// import Link from "next/link"; // Aktifin di local

const Navbar = () => {
  // --- STATE SEARCH ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);

  // --- STATE NOTIFIKASI (REAL TIME) ---
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]); // Awalnya kosong, nunggu fetch
  const [isFetchingNotif, setIsFetchingNotif] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // --- 1. FETCH NOTIFIKASI DARI DATABASE ---
  const fetchNotifications = async () => {
    setIsFetchingNotif(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Gagal ambil notif:", error);
    } finally {
      setIsFetchingNotif(false);
    }
  };

  // --- 2. JALANKAN SAAT PERTAMA LOAD & TIAP 30 DETIK (POLLING) ---
  useEffect(() => {
    fetchNotifications(); // Panggil pas pertama buka

    // Set interval buat ngecek database tiap 30 detik
    // Biar admin tau kalo ada orderan baru tanpa refresh page
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(intervalId); // Bersihin timer pas pindah halaman
  }, []);

  // --- LOGIC SEARCH (SAMA KAYAK SEBELUMNYA) ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (keyword) => {
    setIsLoading(true);
    setShowResults(true);
    try {
      const res = await fetch(`/api/search?q=${keyword}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = (menu) => {
    setShowResults(false);
    setQuery("");
    setSelectedMenu(menu);
  };

  const handleOrderClick = (url) => {
    setShowResults(false);
    setQuery("");
    window.location.href = url;
  };

  // Fungsi pura-pura "Baca Notif" (Cuma di frontend sementara)
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case "warning":
        return <AlertTriangle size={16} className="text-orange-500" />;
      case "success":
        return <CheckCircle size={16} className="text-green-500" />;
      default:
        return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[50] w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex justify-between items-center transition-all duration-300">
        {/* --- KIRI: BRAND --- */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-gray-100 lg:hidden text-gray-600 transition-colors">
            <Menu size={24} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform duration-300">
              <Store size={20} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-lg leading-tight tracking-tight">
                Warkop<span className="text-blue-600">AgamNusantara</span>
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* --- TENGAH: SEARCH BAR --- */}
        <div className="hidden md:flex flex-1 max-w-md mx-8 relative" ref={searchRef}>
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {isLoading ? <Loader2 size={18} className="text-blue-500 animate-spin" /> : <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results) setShowResults(true);
              }}
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-200 sm:text-sm"
              placeholder="Cari menu"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* --- DROPDOWN SEARCH RESULT --- */}
          {showResults && results && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-96 overflow-y-auto z-[60]">
              {results.menus?.length === 0 && results.orders?.length === 0 && <div className="p-4 text-center text-gray-500 text-sm">Tidak ditemukan hasil untuk "{query}" 😔</div>}
              {results.menus?.length > 0 && (
                <div className="py-2">
                  <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Menu</h4>
                  {results.menus.map((menu) => (
                    <div key={menu.id} onClick={() => handleMenuClick(menu)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors group">
                      <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 group-hover:bg-orange-200 transition">
                        <Utensils size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{menu.nama}</p>
                        <p className="text-xs text-gray-500">Klik untuk lihat detail</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.orders?.length > 0 && (
                <div className="py-2">
                  <h4 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Transaksi</h4>
                  {results.orders.map((order) => (
                    <div key={order.id} onClick={() => handleOrderClick("/dashboard/history")} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors">
                      <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                        <User size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{order.customers?.name || "Guest"}</p>
                        <p className="text-xs text-gray-500">
                          Order #{order.id} • {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- KANAN: ACTIONS --- */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* --- NOTIFIKASI DROPDOWN (REAL TIME) --- */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className={`relative p-2 rounded-full transition-all duration-200 group ${showNotif ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}>
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60] animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-800">Notifikasi</h3>
                  <div className="flex gap-2">
                    <button onClick={fetchNotifications} className="text-xs text-gray-500 hover:text-blue-600" disabled={isFetchingNotif}>
                      {isFetchingNotif ? "Loading..." : "Refresh"}
                    </button>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        Baca Semua
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Belum ada notifikasi baru, santuy aja bang! 😎</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3 ${!notif.read ? "bg-blue-50/30" : ""}`}>
                        <div
                          className={`mt-1 p-1.5 rounded-full h-fit shrink-0 
                          ${notif.type === "warning" ? "bg-orange-100" : notif.type === "success" ? "bg-green-100" : "bg-blue-100"}
                        `}
                        >
                          {getNotifIcon(notif.type)}
                        </div>
                        <div>
                          <p className={`text-sm ${!notif.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">{notif.time}</p>
                        </div>
                        {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* --------------------------- */}

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <span className="font-bold text-sm">AD</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 leading-none">Admin</span>
              <span className="text-[10px] text-gray-500 font-medium mt-0.5">Super Admin</span>
            </div>
            <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
          </div>
        </div>
      </nav>

      {/* --- MODAL DETAIL MENU --- */}
      {selectedMenu && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
            <div className="relative h-48 bg-gray-200">
              {selectedMenu.gambar ? (
                <img src={selectedMenu.gambar} alt={selectedMenu.nama} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Utensils size={48} />
                </div>
              )}
              <button onClick={() => setSelectedMenu(null)} className="absolute top-3 right-3 p-2 bg-white/50 hover:bg-white rounded-full text-gray-800 transition-colors backdrop-blur-md">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMenu.nama}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1">
                      <Tag size={12} />
                      {selectedMenu.kategori}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">Rp {selectedMenu.harga.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMenu(null)} className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors">
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

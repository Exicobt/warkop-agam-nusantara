"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Package2,
  ShoppingBag,
  Users,
  Package,
  LogOut,
  TrendingUp,
  Wallet,
  Utensils,
  History,
} from "lucide-react";
// Mengganti import Link dari "next/link" menjadi tag <a> biasa
// import Link from "next/link"; 
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const Dashboard = () => {
  const [menus, setMenus] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [updating, setUpdating] = useState(false);
  
  // State baru untuk filter
  const [revenueFilter, setRevenueFilter] = useState('weekly'); // Default ke mingguan
  const [menuFilter, setMenuFilter] = useState('daily'); // Default ke harian

  useEffect(() => {
    fetchMenu();
    fetchOrder();
    fetchTable();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setMenus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrder = async () => {
    try {
      // Mengambil semua order, termasuk yang sudah selesai/lunas
      const res = await fetch("/api/orders?status=all"); 
      const data = await res.json();
      // Pastikan data adalah array, jika tidak, inisialisasi dengan array kosong
      setOrders(Array.isArray(data) ? data : []); 
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTable = async () => {
    try {
      const res = await fetch("/api/table");
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleButton = async (e) => {
    try {
      setUpdating(true);
      await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...e,
          table_id: e.id,
          status: "available",
          action: "update",
        }),
      });
      toast.success(`Meja ${e.table_number} selesai`);
      fetchTable();
    } catch (err) {
      toast.error("Gagal update data");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    const toastId = toast.loading("Sedang logout...");
    try {
      await fetch("/api/logout", { method: "POST" });
      toast.success("Berhasil logout", { id: toastId });
      window.location.href = "/";
    } catch (error) {
      toast.error("Gagal logout", { id: toastId });
    }
  };

  // --- LOGIC PENGOLAHAN DATA ---

  // Fungsi utility untuk menentukan tanggal mulai berdasarkan filter
  const getStartDate = (filter) => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Reset waktu ke tengah malam

    if (filter === 'daily') {
      return startDate; // Mulai hari ini
    } else if (filter === 'weekly') {
      startDate.setDate(startDate.getDate() - 6); // 7 hari terakhir termasuk hari ini
    } else if (filter === 'monthly') {
      startDate.setDate(startDate.getDate() - 29); // 30 hari terakhir termasuk hari ini
    }
    return startDate;
  };

  // 1. Hitung Pendapatan Harian (Tetap)
  const dailyRevenue = useMemo(() => {
    if (!orders.length) return 0;
    const today = new Date().toDateString(); 
    let total = 0;

    orders.forEach((basket) => {
      // Cek apakah status sudah 'finish' (lunas)
      if (basket.status === "finish" && basket.create_at) {
        const orderDate = new Date(basket.create_at).toDateString();

        // Bandingkan dengan tanggal hari ini
        if (orderDate === today) {
          const basketTotal = basket.orders?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
          total += basketTotal;
        }
      }
    });
    return total;
  }, [orders]);


  // 2. Trend Pendapatan (Diperbarui untuk mendukung filter 'weekly' (7 hari) dan 'monthly' (30 hari))
  const chartRevenueData = useMemo(() => {
    if (!orders.length) return [];
    
    const startDate = getStartDate(revenueFilter);
    const dateMap = new Map();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Inisialisasi Map untuk rentang waktu (7 atau 30 hari)
    const daysCount = revenueFilter === 'monthly' ? 30 : 7;
    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        let name;

        if (revenueFilter === 'weekly') {
          // Gunakan nama hari untuk tampilan mingguan
          name = dayNames[d.getDay()];
        } else {
          // Gunakan format DD/MM untuk tampilan bulanan
          name = `${d.getDate()}/${d.getMonth() + 1}`;
        }

        dateMap.set(dateKey, { name, total: 0, dateKey });
    }

    // Mengisi data total dari orders
    orders.forEach((basket) => {
      if (basket.status === "finish" && basket.create_at) {
        const orderDate = new Date(basket.create_at);
        orderDate.setHours(0, 0, 0, 0);
        
        // Filter berdasarkan tanggal mulai
        if (orderDate >= startDate) {
          const dateKey = orderDate.toISOString().split('T')[0];
          const basketTotal = basket.orders?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
          
          if (dateMap.has(dateKey)) {
             dateMap.get(dateKey).total += basketTotal;
          }
        }
      }
    });

    // Urutkan berdasarkan tanggal (dateKey)
    return Array.from(dateMap.values()).sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  }, [orders, revenueFilter]);


  // 3. Menu Terlaris (Diperbarui untuk mendukung filter 'daily', 'weekly', 'monthly')
  const popularMenuData = useMemo(() => {
    if (!orders.length) return [];
    
    const startDate = getStartDate(menuFilter);
    const counts = {};

    // Filter pesanan yang sudah lunas berdasarkan rentang waktu
    const filteredOrders = orders.filter((basket) => {
      if (basket.status !== "finish" || !basket.create_at) return false;
      const orderDate = new Date(basket.create_at);
      return orderDate >= startDate;
    });

    filteredOrders.forEach((basket) => {
      if (basket.orders && Array.isArray(basket.orders)) { 
        basket.orders.forEach((item) => {
          const menuName = item.menu?.nama || "Menu Dihapus";
          const qty = item.qty || 0;
          counts[menuName] = (counts[menuName] || 0) + qty;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, menuFilter]);

  // Fungsi utilitas untuk format Rupiah
  const formatRupiah = (amount) => {
    return amount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
  };

  // Jumlah meja terisi saat ini (digunakan di bagian Monitor Meja)
  const occupiedTablesCount = tables.filter((t) => t.status === "occupied").length;
  // Meja yang sedang ditempati (digunakan di Live Monitor)
  const tablesOccupied = tables.filter((t) => t.status === "occupied");


  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-8 px-6 pb-6 flex-col max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm mb-8 border border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">👋 Halo, Admin!</h1>
            <p className="text-gray-500 text-sm mt-1">Pantau terus restoranmu, jangan sampai ada meja kosong kelamaan ya!</p>
          </div>

          <div className="flex gap-3">
            {/* --- TOMBOL HISTORY (Diubah dari Link ke <a>) --- */}
            <a href="/dashboard/history" className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all duration-300 font-medium group border border-blue-100">
              <History className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              History
            </a>
            {/* ----------------------------- */}

            <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-medium group border border-red-100">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* CARD 1: TOTAL MENU */}
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Utensils size={100} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <Package2 className="w-8 h-8 opacity-80" />
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">Database</span>
              </div>
              <div className="text-3xl font-bold mb-1 relative z-10">{menus.length}</div>
              <div className="text-green-100 font-medium relative z-10">Total Menu</div>
            </div>

            {/* CARD 2: TOTAL TRANSAKSI */}
            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <TrendingUp size={100} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <ShoppingBag className="w-8 h-8 opacity-80" />
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">Total Basket</span>
              </div>
              <div className="text-3xl font-bold mb-1 relative z-10">{orders.length}</div>
              <div className="text-blue-100 font-medium relative z-10">Total Transaksi Masuk</div>
            </div>

            {/* CARD 3: PENDAPATAN HARIAN */}
            <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Wallet size={100} />
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <Wallet className="w-8 h-8 opacity-80" />
                <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">Hari Ini</span>
              </div>
              <div className="text-2xl font-bold mb-1 relative z-10">
                {formatRupiah(dailyRevenue)}
              </div>
              <div className="text-orange-100 font-medium relative z-10">Pendapatan Harian</div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="text-blue-500" size={20} />
                  Trend Pendapatan
                </h3>
                {/* Filter Pendapatan */}
                <div className="flex space-x-2 p-1 bg-gray-100 rounded-xl">
                  {['weekly', 'monthly'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRevenueFilter(filter)}
                      className={`text-xs px-3 py-1.5 font-medium rounded-lg transition-all ${
                        revenueFilter === filter
                          ? 'bg-white shadow-sm text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {filter === 'weekly' ? 'Mingguan (7 Hari)' : 'Bulanan (30 Hari)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                {chartRevenueData.length > 0 && chartRevenueData.some((d) => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      {/* XAxis menampilkan nama hari atau tanggal tergantung filter */}
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${(value / 1000).toFixed(0)}k`} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`} />
                      <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm italic">Belum ada data transaksi lunas yang cukup dalam rentang ini.</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Utensils className="text-green-500" size={20} />
                  Top 5 Menu Terlaris
                </h3>
                {/* Filter Menu Terlaris */}
                <div className="flex space-x-2 p-1 bg-gray-100 rounded-xl">
                  {['daily', 'weekly', 'monthly'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setMenuFilter(filter)}
                      className={`text-xs px-3 py-1.5 font-medium rounded-lg transition-all ${
                        menuFilter === filter
                          ? 'bg-white shadow-sm text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {filter === 'daily' ? 'Harian' : filter === 'weekly' ? 'Mingguan' : 'Bulanan'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 w-full">
                {popularMenuData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularMenuData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                      <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px" }} />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm italic">Belum ada pesanan lunas masuk dalam rentang ini.</div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE MONITOR */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  Monitor Meja & Pelanggan
                  <span className="ml-4 text-sm font-medium bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                    {occupiedTablesCount} Meja Terisi dari {tables.length} Total Meja
                  </span>
                </h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-600 px-3 py-1 rounded-full animate-pulse">Live Update</span>
              </div>

              {tablesOccupied.length < 1 ? (
                <div className="h-40 w-full flex flex-col justify-center items-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <Users className="w-10 h-10 mb-2 opacity-20" />
                  <p>Belum ada pelanggan yang duduk manis.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tablesOccupied.map((table) => {
                    // Cari basket yang aktif (belum selesai/batal) dan terkait dengan meja ini
                    const activeBasket = orders.find((basket) => basket.customers?.table?.id === table.id && basket.status !== "finish" && basket.status !== "cancelled");

                    const customerName = activeBasket ? activeBasket.customers?.name : "Pelanggan Baru";

                    return (
                      <div key={table.id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Users size={20} className="text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">Meja {table.table_number}</h4>
                              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full capitalize">{table.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 pl-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin size={14} />
                            <span className="capitalize">{String(table.location).replace("_", " ")}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                            <Users size={14} />
                            <span>{customerName}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleButton(table)}
                          disabled={updating}
                          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-200 shadow-lg mt-2"
                        >
                          {updating ? "Memproses..." : "Selesaikan Sesi"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
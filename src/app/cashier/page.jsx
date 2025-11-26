"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

const KasirDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=all");
      const data = await res.json();
      // Handle berbagai format response
      const ordersData = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      setOrders(ordersData);
    } catch (err) {
      console.error("Gagal fetch orders:", err);
      setOrders([]);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch("/api/table");
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal fetch tables:", err);
      setTables([]);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTables();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchTables]);

  const handleAcceptOrder = async (order) => {
    setLoading(true);
    try {
      // Ubah status dari 'pending' ke 'waiting' (menunggu dapur)
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: order.id,
          status: "waiting",
        }),
      });

      // Update status meja jadi occupied
      if (order.customers?.table?.id) {
        await fetch("/api/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: order.customers.table.id,
            status: "occupied",
          }),
        });
        fetchTables();
      }

      showNotification("success", `Pesanan #${order.id} diterima & diteruskan ke dapur!`);
      fetchOrders();
    } catch (err) {
      showNotification("error", "Gagal menerima pesanan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async (order) => {
    setLoading(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: order.id,
          status: "cancelled",
        }),
      });

      if (order.customers?.table?.id) {
        await fetch("/api/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: order.customers.table.id,
            status: "available",
          }),
        });
        fetchTables();
      }

      showNotification("success", `Pesanan #${order.id} ditolak.`);
      fetchOrders();
    } catch (err) {
      showNotification("error", "Gagal menolak pesanan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOrder = async (order) => {
    setLoading(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: order.id,
          status: "finish",
        }),
      });

      if (order.customers?.table?.id) {
        await fetch("/api/table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: order.customers.table.id,
            status: "available",
          }),
        });
        fetchTables();
      }

      showNotification("success", `Pembayaran pesanan #${order.id} selesai!`);
      fetchOrders();
    } catch (err) {
      showNotification("error", "Gagal menyelesaikan transaksi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      showNotification("error", "Gagal logout");
    }
  };

  const formatRupiah = (amount) => {
    return amount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      waiting: "bg-blue-100 text-blue-700 border-blue-300",
      preparing: "bg-orange-100 text-orange-700 border-orange-300",
      done: "bg-green-100 text-green-700 border-green-300",
      finish: "bg-gray-100 text-gray-700 border-gray-300",
      cancelled: "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Menunggu Konfirmasi",
      waiting: "Menunggu Dapur",
      preparing: "Sedang Dimasak",
      done: "Siap Dibayar",
      finish: "Selesai",
      cancelled: "Dibatalkan",
    };
    return labels[status] || status;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = filterStatus === "all" || order.status === filterStatus;
      const matchSearch =
        searchQuery === "" ||
        order.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customers?.table?.table_number?.toString().includes(searchQuery) ||
        String(order.id).includes(searchQuery);
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  const { pendingCount, waitingCount, preparingCount, doneCount, todayRevenue } = useMemo(() => {
    const counts = {
      pendingCount: 0,
      waitingCount: 0,
      preparingCount: 0,
      doneCount: 0,
      todayRevenue: 0,
    };
    const today = new Date().toDateString();

    orders.forEach(o => {
      if (o.status === "pending") counts.pendingCount++;
      else if (o.status === "waiting") counts.waitingCount++;
      else if (o.status === "preparing") counts.preparingCount++;
      else if (o.status === "done") counts.doneCount++;
      else if (o.status === "finish" && o.create_at && new Date(o.create_at).toDateString() === today) {
        const total = o.orders?.reduce((s, item) => s + (item.total || 0), 0) || 0;
        counts.todayRevenue += total;
      }
    });

    return counts;
  }, [orders]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-sans">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white font-medium`}>
          {notification.message}
        </div>
      )}

      <div className="flex pt-8 px-4 sm:px-6 pb-6 flex-col max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-xl mb-8 border border-gray-100 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              💰 Dashboard Kasir
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola pesanan masuk dan proses pembayaran
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-medium group border border-red-200 shadow-md"
            disabled={loading}
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </div>
            <div className="text-4xl font-extrabold relative z-10">{pendingCount}</div>
            <div className="text-yellow-100 text-sm font-medium relative z-10">Pesanan Baru</div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl p-4 shadow-xl">
            <div className="text-4xl font-extrabold">{waitingCount + preparingCount}</div>
            <div className="text-blue-100 text-sm font-medium">Sedang Diproses</div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl p-4 shadow-xl">
            <div className="text-4xl font-extrabold">{doneCount}</div>
            <div className="text-green-100 text-sm font-medium">Siap Dibayar</div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-400 to-gray-600 text-white rounded-xl p-4 shadow-xl col-span-2 md:col-span-1">
            <div className="text-2xl font-bold">{tables.filter(t => t.status === 'occupied').length} / {tables.length}</div>
            <div className="text-gray-100 text-sm font-medium">Meja Terisi</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl p-4 shadow-xl col-span-full xl:col-span-1">
            <div className="text-xl font-bold">{formatRupiah(todayRevenue)}</div>
            <div className="text-purple-100 text-sm font-medium">Pendapatan Hari Ini</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama customer, nomor meja, atau ID pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap justify-center md:justify-end">
              {["pending", "waiting", "preparing", "done", "finish", "all"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ${
                    filterStatus === status
                      ? "bg-indigo-600 text-white shadow-lg transform scale-105"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status === "all" ? "Semua" : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-400 text-lg">
                {searchQuery || filterStatus !== "all"
                  ? "Tidak ada pesanan yang sesuai filter"
                  : "Belum ada pesanan masuk"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalAmount = order.orders?.reduce(
                (sum, item) => sum + (item.total || 0),
                0
              ) || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all border-l-4 border-indigo-500 overflow-hidden"
                >
                  <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xl text-gray-900">
                            Pesanan #{order.id}
                          </h3>
                          <p className="text-gray-500 text-xs">
                            {new Date(order.create_at).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {order.customers?.name || "Customer Walk-in"}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Meja {order.customers?.table?.table_number || "Takeaway"}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-700 mb-2 border-b pb-1">
                        Detail Pesanan ({order.orders?.length || 0} Item):
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {order.orders?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm">
                                {item.menu?.nama || "Menu Dihapus"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.qty}x @ {formatRupiah(item.menu?.harga || 0)}
                              </p>
                            </div>
                            <p className="font-bold text-indigo-600 text-sm">
                              {formatRupiah(item.total || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-dashed border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-extrabold text-gray-700">
                          Total Pembayaran:
                        </span>
                        <span className="text-3xl font-extrabold text-indigo-600">
                          {formatRupiah(totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 space-y-2">
                      {order.status === "pending" && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Terima
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order)}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tolak
                          </button>
                        </div>
                      )}

                      {order.status === "done" && (
                        <button
                          onClick={() => handleFinishOrder(order)}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Bayar & Selesaikan
                        </button>
                      )}

                      {(order.status === "waiting" || order.status === "preparing") && (
                        <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 font-semibold">
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Menunggu dapur...</span>
                        </div>
                      )}
                      
                      {order.status === "finish" && (
                        <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-200 font-semibold">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Transaksi Selesai</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default KasirDashboard;
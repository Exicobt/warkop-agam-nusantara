"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  LogOut,
  User,
  Table,
  ChefHat,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Printer,
  RefreshCw,
  Plus,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";

const KasirDashboard = () => {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // today, yesterday, custom
  const [customDate, setCustomDate] = useState("");
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: "", message: "" }), 4000);
  };

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders?status=all");
      const data = await res.json();
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

  const refreshData = useCallback(() => {
    fetchOrders();
    fetchTables();
    showNotification("info", "Data diperbarui");
  }, [fetchOrders, fetchTables]);

  useEffect(() => {
    const debugOrders = async () => {
      try {
        const res = await fetch("/api/orders?status=all");
        const data = await res.json();
        console.log("Debug order data:", data[0]?.total);
      } catch (err) {
        console.error("Debug error:", err);
      }
    };
    debugOrders();
  }, []);
  
  useEffect(() => {
    fetchOrders();
    fetchTables();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchTables]);

  const handleCreateOrder = () => {
    router.push("/cashier/order");
  };

  const handleAcceptOrder = async (order) => {
    setLoading(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basket_id: order.id,
          status: "waiting",
        }),
      });

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

  const handlePrintBill = (order) => {
    const printWindow = window.open("", "", "width=800,height=600");
    const isPajak = 0.11;
    const totalBefore = order.total_price / (1 + isPajak);

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; font-size: 14px; }
            .container { max-width: 400px; margin: 0 auto; border: 1px dashed #000; padding: 20px; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .text-right { text-align: right; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>WARKOP AGAM</h2>
            <p class="center">Jl. Koding No. 404, Medan</p>
            <div class="divider"></div>
            
            <p>No. Order: #${order.id}</p>
            <p>Tgl: ${formatDate(order.created_at)}</p>
            <p>Pelanggan: ${order.customer_name}</p>
            <p>Meja: ${order.table_number}</p>
            
            <div class="divider"></div>
            
            ${order.items
              .map(
                (item) => `
              <div class="flex">
                <span>${item.menu_name} (x${item.qty})</span>
                <span>${item.total.toLocaleString("id-ID")}</span>
              </div>
            `
              )
              .join("")}
            
            <div class="divider"></div>
            
            <div class="flex">
              <span>Subtotal:</span>
              <span>${totalBefore.toLocaleString("id-ID")}</span>
            </div>
            <div class="flex">
              <span>Pajak (11%):</span>
              <span>${(totalBefore * isPajak).toLocaleString("id-ID")}</span>
            </div>
            <div class="flex bold" style="margin-top: 5px; font-size: 16px;">
              <span>TOTAL:</span>
              <span>Rp ${order.total_price.toLocaleString("id-ID")}</span>
            </div>
            
            <div class="divider"></div>
            <p class="center">Terima Kasih!</p>
            <p class="center">Horas!</p>
          </div>
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatRupiah = (amount) => {
    if (!amount) return "Rp 0";
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
      pending: "Menunggu",
      waiting: "Menunggu Dapur",
      preparing: "Dimasak",
      done: "Siap Bayar",
      finish: "Selesai",
      cancelled: "Batal",
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'done': return <Package className="w-4 h-4" />;
      case 'finish': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return "-";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });
    } catch (e) {
      return "-";
    }
  };

  // Filter berdasarkan tanggal untuk pesanan finish
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchStatus = filterStatus === "all" || order.status === filterStatus;
      const matchSearch =
        searchQuery === "" ||
        order.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customers?.table?.table_number?.toString().includes(searchQuery) ||
        String(order.id).includes(searchQuery);
      return matchStatus && matchSearch;
    });

    // Filter tambahan untuk pesanan finish berdasarkan tanggal
    if (filterStatus === "finish") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      filtered = filtered.filter(order => {
        if (!order.create_at) return false;
        const orderDate = new Date(order.create_at);
        orderDate.setHours(0, 0, 0, 0);
        
        switch(dateFilter) {
          case 'today':
            return orderDate.getTime() === today.getTime();
          case 'yesterday':
            return orderDate.getTime() === yesterday.getTime();
          case 'custom':
            if (!customDate) return true;
            const selectedDate = new Date(customDate);
            selectedDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === selectedDate.getTime();
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [orders, filterStatus, searchQuery, dateFilter, customDate]);

  // Ganti kode perhitungan revenue di KasirDashboard:
  const { pendingCount, waitingCount, preparingCount, doneCount, todayRevenue, totalOrders } = useMemo(() => {
    const counts = {
      pendingCount: 0,
      waitingCount: 0,
      preparingCount: 0,
      doneCount: 0,
      todayRevenue: 0,
      totalOrders: 0,
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders.forEach(o => {
      counts.totalOrders++;
      
      // Hitung berdasarkan status
      if (o.status === "pending") counts.pendingCount++;
      else if (o.status === "waiting") counts.waitingCount++;
      else if (o.status === "preparing") counts.preparingCount++;
      else if (o.status === "done") counts.doneCount++;
      
      // Hitung revenue untuk pesanan yang finish hari ini
      if (o.status === "finish") {
        const orderDate = new Date(o.create_at);
        orderDate.setHours(0, 0, 0, 0);
        
        if (orderDate.getTime() === today.getTime()) {
          const total = o.total || 0;
          counts.todayRevenue += total;
        }
      }
    });

    return counts;
  }, [orders]);

  return (
    <div className="w-full min-h-screen font-sans mt-10">
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 ${
          notification.type === "success" ? "bg-green-600" : 
          notification.type === "error" ? "bg-red-600" : "bg-blue-600"
        } text-white font-medium`}>
          {notification.message}
        </div>
      )}

      <div className="flex pt-6 px-4 sm:px-6 pb-6 flex-col max-w-7xl mx-auto">
        {/* Header dengan Tombol Buat Pesanan - Tetap sama */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Kasir</h1>
            <p className="text-gray-500 text-sm">Kelola pesanan dan transaksi pelanggan</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-gray-700 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            
            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg text-sm font-semibold"
            >
              <Plus className="w-5 h-5" />
              Buat Pesanan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Statistik Cards - Versi kompak */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-yellow-100 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-yellow-600">Pending</span>
              <Clock className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-700">{pendingCount}</div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600">Diproses</span>
              <ChefHat className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{waitingCount + preparingCount}</div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-green-100 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-green-600">Siap Bayar</span>
              <Package className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-700">{doneCount}</div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-purple-600">Total Pesanan</span>
              <ShoppingBag className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-700">{totalOrders}</div>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100 flex flex-col col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-indigo-600">Pendapatan</span>
              <DollarSign className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-indigo-700 truncate">
              {formatRupiah(todayRevenue)}
            </div>
          </div>
        </div>

        {/* Filter Section - Versi kompak */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama, meja, atau ID pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Filter Status */}
            <div className="flex flex-wrap gap-2">
              {["pending", "waiting", "preparing", "done", "finish", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    filterStatus === status
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {getStatusIcon(status)}
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter khusus untuk finish */}
          {filterStatus === "finish" && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter Tanggal:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setDateFilter("today"); setCustomDate(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dateFilter === "today"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => { setDateFilter("yesterday"); setCustomDate(""); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dateFilter === "yesterday"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Kemarin
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dateFilter === "custom"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Pilih Tanggal
                </button>
                
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => setCustomDate("")}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Cards - KEMBALI KE TAMPILAN SEBELUMNYA (KOMPAK) */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchQuery || filterStatus !== "all"
                  ? "Tidak ada pesanan yang sesuai filter"
                  : "Belum ada pesanan masuk"}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalAmount = order.total || 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 text-base">
                            #{order.id}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{order.customers?.name || "Walk-in"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Table className="w-3 h-3" />
                            <span>Meja {order.customers?.table?.table_number !== "0" || "Takeaway"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(order.create_at)} • {formatDate(order.create_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{formatRupiah(totalAmount)}</div>
                        <div className="text-xs text-gray-500">
                          {order.orders?.length || 0} item
                        </div>
                      </div>
                    </div>

                    {/* Order Items (Collapsible jika banyak) */}
                    {order.orders && order.orders.length > 0 && (
                      <div className="mt-3 mb-3">
                        <div className="flex flex-wrap gap-1">
                          {order.orders.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-1 bg-gray-50 rounded text-xs border border-gray-100"
                            >
                              <span className="font-medium">{item.qty}x</span>{" "}
                              <span className="text-gray-700">{item.menu?.nama?.slice(0, 15)}</span>
                              {item.menu?.nama?.length > 15 && "..."}
                            </div>
                          ))}
                          {order.orders.length > 3 && (
                            <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                              +{order.orders.length - 3} lagi
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-gray-100">
                      {order.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptOrder(order)}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Terima
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order)}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </button>
                        </div>
                      )}

                      {order.status === "done" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFinishOrder(order)}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                          >
                            <DollarSign className="w-4 h-4" />
                            Bayar
                          </button>
                          <button
                            onClick={() => handlePrintBill(order)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {(order.status === "waiting" || order.status === "preparing") && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Menunggu dapur...
                        </div>
                      )}
                      
                      {order.status === "finish" && (
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Selesai
                          </div>
                          <button
                            onClick={() => handlePrintBill(order)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-all"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {order.status === "cancelled" && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Dibatalkan
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
    </div>
  );
};

export default KasirDashboard;
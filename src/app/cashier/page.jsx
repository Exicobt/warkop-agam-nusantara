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
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      waiting: "bg-blue-50 text-blue-700 border-blue-200",
      preparing: "bg-orange-50 text-orange-700 border-orange-200",
      done: "bg-green-50 text-green-700 border-green-200",
      finish: "bg-gray-50 text-gray-700 border-gray-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700";
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
        {/* Header dengan Tombol Buat Pesanan */}
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

        {/* Statistik Cards - Desain lebih modern */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl shadow-sm border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-yellow-700">Pending</span>
              <div className="p-2 bg-yellow-200 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
            <div className="text-xs text-yellow-600 mt-1">Menunggu konfirmasi</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl shadow-sm border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-blue-700">Diproses</span>
              <div className="p-2 bg-blue-200 rounded-lg">
                <ChefHat className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-800">{waitingCount + preparingCount}</div>
            <div className="text-xs text-blue-600 mt-1">Dalam proses dapur</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl shadow-sm border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-green-700">Siap Bayar</span>
              <div className="p-2 bg-green-200 rounded-lg">
                <Package className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-800">{doneCount}</div>
            <div className="text-xs text-green-600 mt-1">Menunggu pembayaran</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl shadow-sm border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-700">Total Pesanan</span>
              <div className="p-2 bg-purple-200 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-800">{totalOrders}</div>
            <div className="text-xs text-purple-600 mt-1">Semua pesanan</div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl shadow-sm border border-indigo-200 col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-indigo-700">Pendapatan Hari Ini</span>
              <div className="p-2 bg-indigo-200 rounded-lg">
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-800">{formatRupiah(todayRevenue)}</div>
            <div className="text-xs text-indigo-600 mt-1">Dari pesanan selesai hari ini</div>
          </div>
        </div>

        {/* Filter Section - Improved Design */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari nama pelanggan, meja, atau ID pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Filter Status - Scrollable */}
            <div className="w-full lg:w-auto overflow-x-auto">
              <div className="flex flex-nowrap gap-2 pb-1">
                {["pending", "waiting", "preparing", "done", "finish", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                      filterStatus === status
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                  >
                    {getStatusIcon(status)}
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Date Filter khusus untuk finish */}
          {filterStatus === "finish" && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Filter Tanggal:</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setDateFilter("today"); setCustomDate(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === "today"
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => { setDateFilter("yesterday"); setCustomDate(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    dateFilter === "yesterday"
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Kemarin
                </button>
                <button
                  onClick={() => setDateFilter("custom")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    dateFilter === "custom"
                      ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Pilih Tanggal
                </button>
                
                {dateFilter === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setCustomDate("")}
                      className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Order Cards - Improved Design */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {filterStatus === "all" ? "Semua Pesanan" : getStatusLabel(filterStatus)}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredOrders.length} pesanan)
              </span>
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-sm p-10 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 text-lg font-medium mb-2">
                {searchQuery || filterStatus !== "all"
                  ? "Tidak ada pesanan yang sesuai filter"
                  : "Belum ada pesanan masuk"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Reset pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => {
                const totalAmount = order.total || 0;
                const tableNumber = order.customers?.table?.table_number;
                const isTakeaway = tableNumber === "0" || !tableNumber;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden group"
                  >
                    {/* Card Header dengan status */}
                    <div className="border-b border-gray-100 p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {getStatusLabel(order.status)}
                            </div>
                            <span className="text-sm font-medium text-gray-500">
                              {formatTime(order.create_at)} • {formatDate(order.create_at)}
                            </span>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 text-xl">
                            Pesanan #{order.id}
                          </h3>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{formatRupiah(totalAmount)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {order.orders?.length || 0} item
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Customer Info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{order.customers?.name || "Walk-in Customer"}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Table className="w-4 h-4" />
                                <span>{isTakeaway ? "Takeaway" : `Meja ${tableNumber}`}</span>
                              </div>
                              {order.customers?.phone && (
                                <span className="text-gray-400">•</span>
                              )}
                              {order.customers?.phone && (
                                <span className="text-blue-600">{order.customers.phone}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.orders && order.orders.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
                          <div className="space-y-2">
                            {order.orders.slice(0, 4).map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">
                                    {item.qty}x {item.menu?.nama || item.name || "Item"}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs text-gray-500 mt-1 italic">Catatan: {item.notes}</p>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-gray-700">
                                  {formatRupiah(item.price * item.qty)}
                                </div>
                              </div>
                            ))}
                            {order.orders.length > 4 && (
                              <div className="text-center py-2 text-sm text-gray-500">
                                +{order.orders.length - 4} item lainnya
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-gray-100">
                        {order.status === "pending" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleAcceptOrder(order)}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Terima Pesanan
                            </button>
                            <button
                              onClick={() => handleRejectOrder(order)}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            >
                              <XCircle className="w-5 h-5" />
                              Tolak
                            </button>
                          </div>
                        )}

                        {order.status === "done" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleFinishOrder(order)}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                            >
                              <DollarSign className="w-5 h-5" />
                              Proses Pembayaran
                            </button>
                            <button
                              onClick={() => handlePrintBill(order)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all"
                            >
                              <Printer className="w-5 h-5" />
                              Print
                            </button>
                          </div>
                        )}

                        {(order.status === "waiting" || order.status === "preparing") && (
                          <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl border border-blue-200 text-sm font-semibold">
                            <Clock className="w-5 h-5 animate-pulse" />
                            Pesanan sedang diproses dapur...
                          </div>
                        )}
                        
                        {order.status === "finish" && (
                          <div className="flex gap-3">
                            <div className="flex-1 flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
                              <CheckCircle className="w-5 h-5" />
                              Transaksi Selesai
                            </div>
                            <button
                              onClick={() => handlePrintBill(order)}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 rounded-xl text-sm font-semibold transition-all"
                            >
                              <Printer className="w-5 h-5" />
                              Ulang Print
                            </button>
                          </div>
                        )}

                        {order.status === "cancelled" && (
                          <div className="flex items-center justify-center gap-3 py-3 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-xl border border-red-200 text-sm font-semibold">
                            <XCircle className="w-5 h-5" />
                            Pesanan Dibatalkan
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KasirDashboard;
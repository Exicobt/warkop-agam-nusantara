"use client";

import { useEffect, useState } from "react";
// KITA GANTI IMPORT KE 'lucide-react' BIAR PASTI JALAN
import { ArrowLeft, Printer, Trash, Receipt } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const AdminHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/history");
      if (!response.ok) {
        throw new Error("Gagal mengambil data history");
      }
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      waiting: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Menunggu",
      },
      preparing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Disiapkan",
      },
      done: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Selesai",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Dibatalkan",
      },
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const filteredHistory = history.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 animate-pulse">
            <div className="h-12 w-40 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-20 w-full bg-gray-200 rounded"></div>
            <div className="h-20 w-full bg-gray-200 rounded"></div>
            <div className="h-20 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button className="p-2 hover:bg-gray-200 rounded-full transition group">
                <ArrowLeft size={24} className="text-gray-700 group-hover:-translate-x-1 transition-transform" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Receipt size={32} className="text-blue-600" />
                Admin History
              </h1>
              <p className="text-gray-500 text-sm">Pantau semua jejak transaksi di sini.</p>
            </div>
          </div>
          <button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Refresh Data
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["all", "waiting", "preparing", "done", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize whitespace-nowrap ${filterStatus === status ? "bg-slate-800 text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
            >
              {status === "all" ? "Semua" : status}
            </button>
          ))}
        </div>

        {/* Content */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Receipt size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Belum Ada Data</h3>
            <p className="text-gray-500">Sepertinya restoran lagi sepi atau filtermu terlalu spesifik.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">No. Order</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Pelanggan</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Meja</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Tipe</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Total</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Waktu</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">Aksi</th>
                  </tr>
                </thead>

                {filteredHistory.map((order) => (
                  <tbody key={order.id} className="border-b last:border-0 hover:bg-slate-50/50 transition duration-150">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-medium">{order.customer_name || "Guest"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold">{order.table_number}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.order_type}</td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">Rp {order.total_price.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button onClick={() => toggleRow(order.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline">
                            {expandedRows.has(order.id) ? "Tutup" : "Detail"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Detail Row */}
                    {expandedRows.has(order.id) && (
                      <tr className="bg-slate-50/80 shadow-inner">
                        <td colSpan="8" className="px-6 py-4">
                          <div className="bg-white p-4 rounded-xl border border-gray-200 max-w-3xl ml-10 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">🧾 Rincian Pesanan #{order.id}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2 last:border-0">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-800">{item.menu_name}</span>
                                      <span className="text-xs text-gray-500">
                                        {item.qty} x Rp {item.price.toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-gray-900">Rp {item.total.toLocaleString("id-ID")}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg h-fit">
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-gray-500">Subtotal</span>
                                  <span className="font-medium">Rp {order.total_price.toLocaleString("id-ID")}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-500">Status Bayar</span>
                                  <span className="font-medium text-green-600">Lunas</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                ))}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHistoryPage;

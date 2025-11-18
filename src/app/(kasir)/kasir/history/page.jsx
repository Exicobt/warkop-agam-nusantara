"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

const HistoryPage = () => {
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

    const config = statusConfig[status] || statusConfig.waiting;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const filteredHistory = history.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const handlePrint = (order) => {
    const printWindow = window.open("", "", "width=800,height=600");
    const isPajak = 0.11;
    const totalBefore = order.total_price / (1 + isPajak);

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { text-align: center; }
            .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>INVOICE</h1>
            <div class="info">
              <div>
                <p><strong>No. Order:</strong> ${order.id}</p>
                <p><strong>Pelanggan:</strong> ${order.customer_name}</p>
                <p><strong>Meja:</strong> ${order.table_number}</p>
              </div>
              <div>
                <p><strong>Tipe Order:</strong> ${order.order_type}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Tanggal:</strong> ${formatDate(order.created_at)}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Menu</th>
                  <th>Qty</th>
                  <th>Harga</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.menu_name}</td>
                    <td>${item.qty}</td>
                    <td>Rp ${item.price.toLocaleString("id-ID")}</td>
                    <td>Rp ${item.total.toLocaleString("id-ID")}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div style="text-align: right; margin-bottom: 10px;">
              <p><strong>Subtotal:</strong> Rp ${totalBefore.toLocaleString("id-ID")}</p>
              <p><strong>Pajak (${isPajak * 100}%):</strong> Rp ${(totalBefore * isPajak).toLocaleString("id-ID")}</p>
              <p style="font-size: 18px;"><strong>Total:</strong> Rp ${order.total_price.toLocaleString("id-ID")}</p>
            </div>

            <div class="footer">
              <p>Terima kasih telah berbelanja!</p>
            </div>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-12 w-40" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
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
            <Link href="/kasir">
              <button className="p-2 hover:bg-gray-200 rounded-full transition">
                <ArrowLeft size={24} className="text-gray-700" />
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">History Pemesanan</h1>
          </div>
          <button onClick={fetchHistory} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            Semua
          </button>
          <button onClick={() => setFilterStatus("waiting")} className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "waiting" ? "bg-yellow-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            Menunggu
          </button>
          <button onClick={() => setFilterStatus("done")} className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "done" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            Selesai
          </button>
          <button onClick={() => setFilterStatus("cancelled")} className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === "cancelled" ? "bg-red-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
            Dibatalkan
          </button>
        </div>

        {/* Content */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">Tidak ada data history pemesanan</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">No. Order</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">Pelanggan</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">Meja</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">Tipe Order</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-700">Tanggal</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>

                {/* PERUBAHAN DISINI: Hapus <tbody> pembungkus luar, langsung map aja */}
                {filteredHistory.map((order) => (
                  <tbody key={order.id} className="border-b hover:bg-gray-50 transition">
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id}</td>
                      {/* Tambahin 'whitespace-nowrap' biar nama panjang gak bikin kolom gepeng */}
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{order.customer_name || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.table_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.order_type}</td>
                      <td className="px-6 py-4 text-sm">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Rp {order.total_price.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <button onClick={() => toggleRow(order.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm underline decoration-dotted">
                            {expandedRows.has(order.id) ? "Tutup" : "Detail"}
                          </button>
                          <button onClick={() => handlePrint(order)} className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-200 rounded transition" title="Print Invoice">
                            <Printer size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Baris Detail (Dropdown) */}
                    {expandedRows.has(order.id) && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="8" className="px-6 py-4 shadow-inner">
                          <div className="bg-white p-4 rounded-lg border border-gray-200 max-w-2xl">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">🧾 Rincian Menu</h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed pb-2 last:border-0 last:pb-0">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-700">{item.menu_name}</span>
                                    <span className="text-xs text-gray-500">
                                      {item.qty} x Rp {item.price.toLocaleString("id-ID")}
                                    </span>
                                  </div>
                                  <span className="font-semibold text-gray-900">Rp {item.total.toLocaleString("id-ID")}</span>
                                </div>
                              ))}
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

export default HistoryPage;

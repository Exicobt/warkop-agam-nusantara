"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Edit2, Plus, Trash2, Users2, XCircle, QrCode, Download, RefreshCw } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../components/Table";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import QRCode from "qrcode";

const TablePage = () => {
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(null);
  const router = useRouter();

  const fetchTable = useCallback(async () => {
    try {
      const res = await fetch("/api/table");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data meja");
    }
  }, []);

  useEffect(() => {
    fetchTable();
  }, [fetchTable]);

  const handleDelete = (item) => {
    const fetchDelete = async () => {
      const res = await fetch("/api/table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: item.id,
          action: 'delete'
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Gagal menghapus meja");
        return false;
      }
      return true;
    };
    toast(
      (t) => (
        <span>
          Yakin hapus data ini?
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                if (await fetchDelete()) {
                  await fetchTable();
                  toast.success(`Berhasil menghapus meja ${item.table_number}`);
                }
              }}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Ya
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 px-3 py-1 rounded"
            >
              Batal
            </button>
          </div>
        </span>
      ),
      {
        duration: 10000,
      }
    );
  };

  const generateQRCode = async (table, regenerate = false) => {
    setIsGeneratingQR(table.id);
    
    try {
      // Generate token via API
      const tokenResponse = await fetch("/api/table/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_number: table.table_number,
          table_id: table.id,
          regenerate,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Gagal generate token QR");
      }

      const { qr_url } = await tokenResponse.json();

      // Generate QR Code image dari URL yang aman
      const qrImageUrl = await QRCode.toDataURL(qr_url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });

      // Create canvas untuk design
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');

      // Background putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header dengan gradient orange
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#ea580c');
      gradient.addColorStop(1, '#f97316');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 100);
      
      // Nama Restaurant
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('WARKOP AGAM NUSANTARA', canvas.width / 2, 40);

      // Subtitle
      ctx.font = '16px Arial';
      ctx.fillText('Scan QR Code untuk Memesan', canvas.width / 2, 70);

      // QR Code
      const qrImg = new Image();
      qrImg.src = qrImageUrl;
      
      qrImg.onload = () => {
        // Background rounded untuk QR
        ctx.fillStyle = '#f8fafc';
        
        // Fungsi rounded rectangle
        ctx.beginPath();
        ctx.moveTo(150 + 15, 120);
        ctx.arcTo(150 + 300, 120, 150 + 300, 120 + 300, 15);
        ctx.arcTo(150 + 300, 120 + 300, 150, 120 + 300, 15);
        ctx.arcTo(150, 120 + 300, 150, 120, 15);
        ctx.arcTo(150, 120, 150 + 300, 120, 15);
        ctx.closePath();
        ctx.fill();
        
        // QR Code di tengah
        ctx.drawImage(qrImg, 150, 120, 300, 300);

        // Info Meja
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`MEJA ${table.table_number}`, canvas.width / 2, 450);

        // Instructions
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial';
        ctx.fillText('Scan untuk memesan langsung dari meja', canvas.width / 2, 475);
        
        // Download the image
        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = `QR-Meja-${table.table_number}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        toast.success(
          regenerate
            ? `QR Meja ${table.table_number} diganti. Cetak ulang QR yang baru.`
            : `QR Code Meja ${table.table_number} berhasil di download`
        );
        if (regenerate) fetchTable();
        setIsGeneratingQR(null);
      };

      qrImg.onerror = () => {
        toast.error("Gagal memuat gambar QR");
        setIsGeneratingQR(null);
      };

    } catch (error) {
      console.error("Error generating QR:", error);
      toast.error("Gagal generate QR Code");
      setIsGeneratingQR(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="flex pt-16">
        <div className="flex-1 p-6 ">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Manajemen Meja
                </h2>
                <p className="text-gray-600">Kelola Meja dan QR Code</p>
              </div>
              <button
                onClick={() => router.push("/dashboard/table/tambah")}
                className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Meja
              </button>
            </div>

            {/* statistik */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex gap-5 items-center bg-white p-5 rounded-lg shadow-md">
                <div className="p-2 w-10 h-10 rounded-md bg-yellow-300/30">
                  <Users2 className="text-yellow-400" />
                </div>
                <div className="flex flex-col">
                  Total Meja
                  <span className="font-bold text-xxl">
                    { tables.length }
                  </span>
                </div>
              </div>
              <div className="flex gap-5 items-center bg-white p-5 rounded-lg shadow-md">
                <div className="p-2 w-10 h-10 rounded-md bg-green-300/30">
                  <CheckCircle className="text-green-400" />
                </div>
                <div className="flex flex-col">
                  Tersedia
                  <span className="font-bold text-xxl">
                    {
                      tables.filter((table) => table.status === "available")
                        .length
                    }
                  </span>
                </div>
              </div>
              <div className="flex gap-5 items-center bg-white p-5 rounded-lg shadow-md">
                <div className="p-2 w-10 h-10 rounded-md bg-red-300/30">
                  <XCircle className="text-red-400" />
                </div>
                <div className="flex flex-col">
                  Tidak Tersedia
                  <span className="font-bold text-xxl">
                    {
                      tables.filter((table) => table.status === "not_available")
                        .length
                    }
                  </span>
                </div>
              </div>
              <div className="flex gap-5 items-center bg-white p-5 rounded-lg shadow-md">
                <div className="p-2 w-10 h-10 rounded-md bg-brand-300/30">
                  <QrCode className="text-brand-400" />
                </div>
                <div className="flex flex-col">
                  QR Tersedia
                  <span className="font-bold text-xxl">
                    {tables.filter((t) => t.qr_generated_at).length}
                  </span>
                </div>
              </div>
            </div>

            {/* cari */}
            <div className="flex justify-center items-center bg-white p-4 rounded-md shadow-md">
              <input
                type="text"
                placeholder="Cari nomor meja"
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-200 w-full p-2 rounded-md focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* tabel meja */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Meja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables
                      .filter((table) =>
                        table.table_number
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .sort((a, b) => a.table_number - b.table_number)
                      .map((table, index) => {
                      return (
                        <TableRow key={index}>
                          <TableCell>{index+1}</TableCell>
                          <TableCell className="font-semibold">
                            Meja {table.table_number}
                          </TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              table.status === "available" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {table.status === "available" ? "Tersedia" : "Tidak Tersedia"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                            <button
                              onClick={() => generateQRCode(table)}
                              disabled={isGeneratingQR === table.id}
                              className="flex items-center justify-center gap-3 text-brand-500 underline cursor-pointer"
                            >
                              {isGeneratingQR === table.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  Download QR
                                </>
                              )}
                            </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Ganti QR Meja ${table.table_number}? QR yang sudah dicetak/ditempel akan berhenti berfungsi dan harus dicetak ulang.`)) {
                                    generateQRCode(table, true);
                                  }
                                }}
                                disabled={isGeneratingQR === table.id}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
                                title="Ganti QR (QR lama tidak berlaku)"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => {
                                  router.push(`table/update/${table.id}`);
                                }}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Edit Meja"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(table)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Hapus Meja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePage;
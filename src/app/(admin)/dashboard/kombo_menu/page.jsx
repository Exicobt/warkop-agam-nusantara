"use client";

import { Plus, Search, Edit, Trash2, ListRestartIcon, Package } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
} from "../components/Table";
import { TableRow } from "@/app/components/ui/table";

const KomboMenu = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [komboMenus, setKomboMenus] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const router = useRouter();

  // Fetch kombo menu dengan include items
  const fetchKomboMenu = async () => {
    try {
      const res = await fetch("/api/combo");
      const data = await res.json();
      console.log("Data kombo:", data); // Debug log
      setKomboMenus(data);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // Fetch semua menu untuk pilihan
  const fetchAllMenus = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setAllMenus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllKomboMenu = () => {
    toast(
      (t) => (
        <span>
          Anda yakin ingin menghapus semua kombo menu? Ini akan menghapus semua data paket menu!
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await fetch("/api/combo", {
                  method: "DELETE",
                });
                await fetchKomboMenu();
                toast.success("Berhasil menghapus semua kombo menu");
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

  const deleteKomboMenu = (item) => {
    toast(
      (t) => (
        <span>
          Yakin hapus kombo menu <strong>{item.name}</strong>?
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await fetch(`/api/combo/${item.id}`, {
                  method: "DELETE",
                });
                await fetchKomboMenu();
                toast.success(`Berhasil menghapus ${item.name}`);
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

  // Hitung total harga individual dari menu dalam kombo
  const calculateTotalIndividualPrice = (combo) => {
    if (!combo.items || !allMenus.length) return 0;
    
    return combo.items.reduce((total, comboItem) => {
      const menu = allMenus.find(m => m.id === comboItem.menu_id);
      return total + (menu ? menu.harga : 0);
    }, 0);
  };

  // Hitung persentase diskon
  const calculateDiscountPercentage = (combo) => {
    const totalIndividual = calculateTotalIndividualPrice(combo);
    if (totalIndividual === 0 || !combo.price) return 0;
    
    const discount = ((totalIndividual - combo.price) / totalIndividual) * 100;
    return Math.max(0, Math.round(discount));
  };

  // Get nama menu dari combo item
  const getMenuNameFromComboItem = (comboItem) => {
    const menu = allMenus.find(m => m.id === comboItem.menu_id);
    return menu ? menu.nama : "Menu tidak ditemukan";
  };

  useEffect(() => {
    fetchKomboMenu();
    fetchAllMenus();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">

        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Manajemen Kombo Menu
                </h2>
                <p className="text-gray-600">Kelola paket menu kombinasi makanan dan minuman</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={deleteAllKomboMenu}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <ListRestartIcon className="w-4 h-4" />
                  Reset Semua
                </button>
                <button
                  onClick={() => router.push("/dashboard/kombo_menu/tambah")}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Kombo Menu
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Cari kombo menu..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="w-full h-96 flex items-center justify-center">
                  <div className="loader"></div>
                </div>
              ) : komboMenus.length === 0 ? (
                <div className="w-full h-96 flex flex-col items-center justify-center text-gray-500">
                  <Package className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Tidak ada kombo menu yang tersedia</p>
                  <p className="text-sm">Klik "Tambah Kombo Menu" untuk membuat paket menu pertama</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Paket Menu</TableHead>
                        <TableHead>Isi Paket</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {komboMenus
                        .filter((kombo) =>
                          kombo.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((kombo, index) => {
                          const totalIndividual = calculateTotalIndividualPrice(kombo);
                          const discountPercentage = calculateDiscountPercentage(kombo);
                          
                          return (
                            <TableRow key={kombo.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-800">
                                      {kombo.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {kombo.items?.length || 0} item
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {kombo.items && kombo.items.map((comboItem, idx) => (
                                    <div key={comboItem.id} className="text-sm text-gray-700">
                                      • {getMenuNameFromComboItem(comboItem)}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm text-gray-500 line-through">
                                    Rp {totalIndividual.toLocaleString()}
                                  </div>
                                  <div className="font-semibold text-orange-600">
                                    Rp {kombo.price?.toLocaleString() || "0"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {discountPercentage}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => {
                                      router.push(`/dashboard/kombo_menu/update/${kombo.id}`);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteKomboMenu(kombo)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KomboMenu;
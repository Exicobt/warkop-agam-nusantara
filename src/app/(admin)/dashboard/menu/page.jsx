"use client";

import { Plus, Search, Edit, Trash2, ListRestartIcon } from "lucide-react";
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

const Menu = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [menus, setMenus] = useState([]);
  const router = useRouter();

  const fetchMenu = async () => {
    await fetch("/api/menu")
      .then(async (res) => {
        const data = await res.json();
        setMenus(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const deleteAllMenu = () => {
    const fetchDelete = async () => {
      await fetch("/api/deleteAllMenu", {
        method: "POST",
        headers: {
          "Content-Type": "applications/json",
        },
      });
    };
    toast(
      (t) => (
        <span>
          Anda yakin ingin mereset semua menu? Ini akan menghapus semua data
          menu!
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await fetchDelete();
                toast.success("Berhasil mereset semua menu");
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

  const deleteMenu = (item) => {
    const fetchDelete = async () => {
      await fetch("/api/menu", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu_id: item.id,
        }),
      });
    };
    toast(
      (t) => (
        <span>
          Yakin hapus data ini?
          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await fetchDelete();
                await fetchMenu();
                toast.success(`Berhasil menghapus ${item.nama}`);
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

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">

        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Manajemen Menu
                </h2>
                <p className="text-gray-600">Kelola menu makanan dan minuman</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteAllMenu()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <ListRestartIcon />
                  reset
                </button>
                <button
                  onClick={() => router.push("/dashboard/menu/tambah")}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Menu
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
                      placeholder="Cari menu..."
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
              ) : menus.length == 0 ? (
                <div className="w-full h-96 flex items-center justify-center">
                  TIdak ada menu yang tersedia
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Menu</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead className={"text-center"}>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menus
                        .filter((menu) =>
                          menu.nama
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                        .map((menu, index) => {
                          return (
                            <TableRow>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Image
                                    src={
                                      menu.gambar ||
                                      "https://placehold.co/1000x1000/png"
                                    }
                                    alt=""
                                    width={100}
                                    height={100}
                                    className=""
                                  />
                                  <div>
                                    <div className="font-semibold text-gray-800">
                                      {menu.nama}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                  {menu.kategori}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-semibold">
                                    Rp {menu.harga.toLocaleString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => {
                                      router.push(`menu/update/${menu.id}`);
                                    }}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteMenu(menu)}
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

export default Menu;

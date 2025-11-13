"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

import Search from "@/app/components/ui/search";
import CardMenu from "@/app/components/CardMenu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";

import { CashRegister, Minus, Plus, Trash, Clock } from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import Link from "next/link";

const Menu = () => {
  const [views, setViews] = useState("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const [inOrder, setInOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allOrders, setAllOrders] = useState([]);
  const [orderType, setOrderType] = useState("Dine In");
  const [isLoading, setIsLoading] = useState(false);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectTable, setSelectTable] = useState("");
  const [name, setName] = useState("");

  const nameRef = useRef();

  const pajak = 0.11;
  const totalItem = allOrders.reduce((sum, item) => sum + item.qty, 0);
  const totalHarga = allOrders.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const hargaTotal = totalHarga + totalHarga * pajak;

  const handleName = () => {
    const name = nameRef.current.value;
    setName(name);
  };

  const updateQuantity = (nama, newQty) => {
    if (newQty < 1) return;
    setAllOrders((prev) => prev.map((item) => (item.nama === nama ? { ...item, qty: newQty } : item)));
  };

  const hapusItem = (nama) => {
    setAllOrders((prev) => prev.filter((i) => i.nama !== nama));
  };

  const hapusSemuaMenu = () => setAllOrders([]);

  const selectOrder = async () => {
    if (!orderType.trim()) {
      toast.error("Isi jenis order terlebih dahulu");
      return;
    }

    if (allOrders.length === 0) {
      toast.error("Pesanan masih kosong");
      return;
    }

    if (orderType === "Dine In" && selectTable === "") {
      toast.error("Pilih meja terlebih dahulu");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: allOrders,
          order_type_id: orderType === "Dine In" ? 1 : 2,
          name: name,
          table: selectTable ? selectTable : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || "Gagal menyimpan pesanan";
        throw new Error(message);
      }

      await response.json();
      toast.success("Pesanan berhasil disimpan!");
      setAllOrders([]);
      setInOrder(null);
      setOrderType("Dine In");
      nameRef.current.value = "";
      setSelectTable("");
      fetchTable();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        setMenu(data);
      } catch (err) {
        console.error("Gagal ambil menu:", err);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    if (!inOrder) return;

    const newOrder = {
      id: inOrder.id,
      namaPelanggan: name,
      nama: inOrder.nama,
      harga: inOrder.harga,
      qty: 1,
    };

    setInOrder(null);

    setAllOrders((prev) => {
      const existing = prev.find((i) => i.nama === newOrder.nama);
      if (existing) {
        return prev.map((item) => (item.nama === newOrder.nama ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, newOrder];
    });
  }, [inOrder]);

  const fetchTable = async () => {
    try {
      await fetch("/api/table")
        .then(async (res) => {
          const data = await res.json();
          setTables(data);
          console.log(data);
        })
        .catch((err) => {
          console.error(err);
        });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTable();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative pt-15 w-full min-h-screen md:flex gap-1">
      <Navbar placeholder="Menu" view={views} setView={setViews} />

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/5 h-full bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="w-full">
                <Search placeholder={"Product"} searchItem={(val) => setSearchTerm(val)} />
              </div>

              {/* kategori */}
              <Select onValueChange={(value) => setActiveCategory(value)} defaultValue={activeCategory}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="foods">Food</SelectItem>
                  <SelectItem value="drinks">Drink</SelectItem>
                  <SelectItem value="snacks">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-220px)] overflow-y-auto pb-4">
              {searchTerm !== "" ? (
                <CardMenu view={views} data={menu.filter((item) => item.nama.toLowerCase().includes(searchTerm.toLowerCase()))} onOrder={(item) => setInOrder(item)} />
              ) : activeCategory === "All" ? (
                <CardMenu view={views} data={menu} onOrder={(item) => setInOrder(item)} />
              ) : (
                <CardMenu view={views} data={menu.filter((item) => item.kategori === activeCategory)} onOrder={(item) => setInOrder(item)} />
              )}
              {}
            </div>
          </div>

          {/* Bagian tampilan kasir */}

          <div className="lg:w-2/5 bg-white rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center w-full gap-5">
                {" "}
                <CashRegister size={30} /> {totalItem} Items
              </h2>
              <div className="flex gap-2">
                <Link href="/kasir/history">
                  <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-full" title="Lihat History">
                    <Clock size={20} />
                  </button>
                </Link>
                <button className="text-destructive hover:bg-destructive/10 p-2 rounded-full" onClick={hapusSemuaMenu}>
                  <Trash size={20} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              {/* type order */}

              <Select onValueChange={(val) => setOrderType(val)} value={orderType}>
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Pilih jenis order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Take Away">Take Away</SelectItem>
                  <SelectItem value="Dine In">Dine In</SelectItem>
                </SelectContent>
              </Select>

              {/* pemilihan meja */}

              <Select onValueChange={(val) => setSelectTable(val)} value={selectTable}>
                <SelectTrigger className={`w-full ${orderType === "Take Away" ? "hidden" : ""}`}>
                  <SelectValue placeholder="Pilih meja yang tersedia" />
                </SelectTrigger>
                <SelectContent>
                  {tables
                    .filter((table) => table.status === "available")
                    .map((table) => {
                      return (
                        <SelectItem key={table.table_number} value={table.table_number}>
                          Meja {table.table_number}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6 flex-1 overflow-y-auto">
              {allOrders.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-black/50">Tidak ada pesanan, silahkan memilih produk</div>
              ) : (
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[20%] text-left">Name</TableHead>
                      <TableHead className="w-[20%] text-center">Harga</TableHead>
                      <TableHead className="w-[20%] text-center">Qty</TableHead>
                      <TableHead className="w-[20%] text-center">Total</TableHead>
                      <TableHead className="w-[10%] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders.map((order, i) => (
                      <TableRow key={i}>
                        <TableCell className="capitalize font-medium text-left truncate max-w-[200px]">{order.nama}</TableCell>
                        <TableCell className="text-center">Rp {parseInt(order.harga).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateQuantity(order.nama, order.qty - 1)} className={`p-1 rounded-full hover:bg-gray-100 ${order.qty === 1 ? "invisible" : "bg-gray-100"}`}>
                              <Minus size={12} />
                            </button>
                            <span>{order.qty}</span>
                            <button onClick={() => updateQuantity(order.nama, order.qty + 1)} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                              <Plus size={12} />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">Rp {(order.harga * order.qty).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-center">
                          <button onClick={() => hapusItem(order.nama)} className="text-destructive hover:bg-destructive/10 p-1 rounded-full">
                            <Trash size={15} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="mt-auto pt-4 border-t">
              <div className="flex justify-between items-end mb-4">
                <div className="text-sm text-black/60">
                  <p>Total harga:</p>
                  <p>Pajak: </p>
                  <p className="text-lg font-semibold text-black">
                    Total <span className="text-sm font-normal text-black/60">(pajak {pajak * 100}%)</span>
                  </p>
                </div>
                <div className="text-sm text-right text-black/70">
                  <p>Rp {totalHarga.toLocaleString("id-ID")}</p>
                  <p>
                    ({pajak * 100}%) Rp {(totalHarga * pajak).toLocaleString("id-ID")}
                  </p>
                  <p className="text-highlight text-xl font-bold">Rp {hargaTotal.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <button
                disabled={allOrders.length === 0 || isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${allOrders.length === 0 || isLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-highlight hover:bg-highlight/90"}`}
                onClick={selectOrder}
              >
                {isLoading ? "Menyimpan..." : "ORDER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;

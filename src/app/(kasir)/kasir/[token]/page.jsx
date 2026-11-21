"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

import Search from "@/app/components/ui/search";
import CardMenu from "@/app/components/CardMenu";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

import {
  CashRegister,
  Minus,
  Plus,
  Trash,
  Clock,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, TableIcon } from "lucide-react";

const Menu = () => {
  const params = useParams();
  const router = useRouter();
  const token = params.token;

  const [session, setSession] = useState(null);
  const [views, setViews] = useState("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const [ordered, setOrdered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [menu, setMenu] = useState([]);
  const [combos, setCombos] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/kasir/expired");
      return;
    }

    const validateSession = async () => {
      try {
        const res = await fetch(`/api/orders/validate?token=${token}`);
        const data = await res.json();

        if (!data.valid) {
          toast.error(data.error || "QR code sudah tidak valid");
          router.push("/kasir/expired");
          return;
        }

        // API return { valid: true, table_number: "1", session_id: "..." }
        setSession({
          table_number: data.table_number,
          session_id: data.session_id,
        });
      } catch (error) {
        console.error("Error validating session:", error);
        toast.error("Terjadi kesalahan");
        router.push("/kasir/expired");
      }
    };

    validateSession();
  }, [token, router]);

  const totalItem = allOrders.reduce((sum, item) => sum + item.qty, 0);
  const totalHarga = allOrders.reduce(
    (sum, item) => sum + item.harga * item.qty,
    0
  );
  const hargaTotal = totalHarga;

  const itemKey = (item) => `${item.type}-${item.id}`;

  const addToOrder = (item) => {
    const type = item.type || "menu";
    setAllOrders((prev) => {
      const key = `${type}-${item.id}`;
      if (prev.some((i) => itemKey(i) === key)) {
        return prev.map((i) =>
          itemKey(i) === key ? { ...i, qty: Math.min(i.qty + 1, 99) } : i
        );
      }
      return [...prev, { id: item.id, nama: item.nama, harga: item.harga, qty: 1, type }];
    });
  };

  const updateQuantity = (key, newQty) => {
    if (newQty < 1 || newQty > 99) return;
    setAllOrders((prev) =>
      prev.map((item) => (itemKey(item) === key ? { ...item, qty: newQty } : item))
    );
  };

  const hapusItem = (key) => {
    setAllOrders((prev) => prev.filter((i) => itemKey(i) !== key));
  };

  const hapusSemuaMenu = () => setAllOrders([]);

  const selectOrder = async () => {
    if (allOrders.length === 0) {
      toast.error("Pesanan masih kosong");
      return;
    }

    if (!paymentMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setIsLoading(true);
    try {
      // Harga & total dihitung ulang di server; klien hanya mengirim id, qty, dan tipe.
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: allOrders.map(({ id, qty, type }) => ({ id, qty, type })),
          payment_method_id: parseInt(paymentMethod, 10),
          token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || errorData?.message || "Gagal menyimpan pesanan");
      }

      await response.json();
      toast.success("Pesanan berhasil dikirim!");
      setAllOrders([]);
      setPaymentMethod("");
      setOrdered(true); // QR permanen: tampilkan konfirmasi + tombol pesan lagi
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch menu, combo, dan payment methods
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

    const fetchCombos = async () => {
      try {
        const res = await fetch("/api/combo");
        const data = await res.json();
        setCombos(data || []);
      } catch (err) {
        console.error("Gagal ambil kombo menu:", err);
      }
    };

    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch("/api/payment");
        const data = await res.json();
        if (data && Array.isArray(data.paymentMethods)) {
          setPaymentMethods(data.paymentMethods);
        } else {
          console.error("Data metode pembayaran bukan array:", data);
          toast.error("Format data metode pembayaran salah dari API");
          setPaymentMethods([]);
        }
      } catch (err) {
        console.error("Gagal ambil metode pembayaran:", err);
        toast.error("Gagal memuat metode pembayaran");
      }
    };

    fetchMenu();
    fetchCombos();
    fetchPaymentMethods();
  }, []);

  // Filter data berdasarkan kategori dan search term
  const getFilteredData = () => {
    let filteredData = [];

    if (searchTerm !== "") {
      // Filter menu berdasarkan search term
      const filteredMenu = menu.filter((item) =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filter combo berdasarkan search term
      const filteredCombos = combos.filter((combo) =>
        combo.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      filteredData = [
        ...filteredMenu.map((item) => ({ ...item, type: "menu" })),
        ...filteredCombos.map((combo) => ({
          id: combo.id,
          nama: combo.name,
          harga: combo.price,
          gambar: null,
          kategori: "combo",
          type: "combo",
          items: combo.items,
        })),
      ];
    } else if (activeCategory === "All") {
      // Gabungkan semua menu dan combo
      filteredData = [
        ...menu.map((item) => ({ ...item, type: "menu" })),
        ...combos.map((combo) => ({
          id: combo.id,
          nama: combo.name,
          harga: combo.price,
          gambar: null,
          kategori: "combo",
          type: "combo",
          items: combo.items,
        })),
      ];
    } else if (activeCategory === "combo") {
      // Hanya tampilkan combo
      filteredData = combos.map((combo) => ({
        id: combo.id,
        nama: combo.name,
        harga: combo.price,
        gambar: null,
        kategori: "combo",
        type: "combo",
        items: combo.items,
      }));
    } else {
      // Filter menu berdasarkan kategori
      filteredData = menu
        .filter((item) => item.kategori === activeCategory)
        .map((item) => ({ ...item, type: "menu" }));
    }

    return filteredData;
  };

  // Group data by kategori untuk tampilan terorganisir
  const getGroupedData = () => {
    const filteredData = getFilteredData();

    const grouped = {
      foods: filteredData.filter((item) => item.kategori === "foods"),
      drinks: filteredData.filter((item) => item.kategori === "drinks"),
      snacks: filteredData.filter((item) => item.kategori === "snacks"),
      combo: filteredData.filter((item) => item.kategori === "combo"),
    };

    return grouped;
  };

  const groupedData = getGroupedData();

  if (ordered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="mx-auto text-green-500 mb-4" size={56} />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Pesanan terkirim!</h1>
          <p className="text-gray-600 text-sm">
            Pesanan untuk meja #{session?.table_number} sedang diteruskan ke kasir.
            Silakan tunggu di meja Anda.
          </p>
          <button
            onClick={() => setOrdered(false)}
            className="btn-primary mt-6 w-full"
          >
            Pesan lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-15 w-full min-h-screen md:flex gap-1">
      <Navbar placeholder="Menu" view={views} setView={setViews} />

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/5 h-full bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="w-full">
                <Search
                  placeholder={"Product"}
                  searchItem={(val) => setSearchTerm(val)}
                />
              </div>

              {/* kategori */}
              <Select
                onValueChange={(value) => setActiveCategory(value)}
                defaultValue={activeCategory}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="foods">Food</SelectItem>
                  <SelectItem value="drinks">Drink</SelectItem>
                  <SelectItem value="snacks">Snack</SelectItem>
                  <SelectItem value="combo">Kombo Menu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="h-[calc(100vh-280px)] md:h-[calc(100vh-220px)] overflow-y-auto pb-4">
              {searchTerm !== "" || activeCategory !== "All" ? (
                <CardMenu
                  view={views}
                  data={getFilteredData()}
                  onOrder={addToOrder}
                />
              ) : (
                // Tampilan terorganisir per kategori
                <div className="space-y-8">
                  {/* Kombo Menu Section */}
                  {combos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Package size={24} className="text-brand-500" />
                        <h3 className="text-lg font-bold text-gray-800">
                          Kombo Menu
                        </h3>
                        <span className="bg-brand-100 text-brand-800 px-2 py-1 rounded-full text-xs">
                          {combos.length} paket
                        </span>
                      </div>
                      <CardMenu
                        view={views}
                        data={groupedData.combo}
                        onOrder={addToOrder}
                      />
                    </div>
                  )}

                  {/* Foods Section */}
                  {groupedData.foods.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Makanan
                      </h3>
                      <CardMenu
                        view={views}
                        data={groupedData.foods}
                        onOrder={addToOrder}
                      />
                    </div>
                  )}

                  {/* Drinks Section */}
                  {groupedData.drinks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Minuman
                      </h3>
                      <CardMenu
                        view={views}
                        data={groupedData.drinks}
                        onOrder={addToOrder}
                      />
                    </div>
                  )}

                  {/* Snacks Section */}
                  {groupedData.snacks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        Snack
                      </h3>
                      <CardMenu
                        view={views}
                        data={groupedData.snacks}
                        onOrder={addToOrder}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-2/5 bg-white rounded-lg shadow-sm p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center w-full gap-5">
                <CashRegister size={30} /> {totalItem} Items
              </h2>
              <div className="flex gap-2">
                <button
                  className="text-destructive hover:bg-destructive/10 p-2 rounded-full"
                  onClick={hapusSemuaMenu}
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>

            <div className="mb-6">

              {/* INFORMASI MEJA DARI QR */}
              {session && (
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TableIcon size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Meja
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">
                        #{session.table_number}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Select
                onValueChange={(val) => setPaymentMethod(val)}
                value={paymentMethod}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(paymentMethods) &&
                    paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={String(method.id)}>
                        {method.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6 flex-1 overflow-y-auto">
              {allOrders.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-black/50">
                  Tidak ada pesanan, silahkan memilih produk
                </div>
              ) : (
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[25%] text-left">Name</TableHead>
                      <TableHead className="w-[20%] text-center">
                        Harga
                      </TableHead>
                      <TableHead className="w-[20%] text-center">Qty</TableHead>
                      <TableHead className="w-[20%] text-center">
                        Total
                      </TableHead>
                      <TableHead className="w-[15%] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(allOrders) &&
                      allOrders.map((order) => (
                        <TableRow key={itemKey(order)}>
                          <TableCell className="font-medium text-left">
                            <div className="flex items-center gap-2">
                              {order.type === "combo" && (
                                <Package
                                  size={16}
                                  className="text-brand-500 flex-shrink-0"
                                />
                              )}
                              <span className="capitalize truncate">
                                {order.nama}
                              </span>
                              {order.type === "combo" && (
                                <span className="bg-brand-100 text-brand-800 px-1 py-0.5 rounded text-xs flex-shrink-0">
                                  Kombo
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            Rp {parseInt(order.harga).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(itemKey(order), order.qty - 1)
                                }
                                className={`p-1 rounded-full hover:bg-gray-100 ${
                                  order.qty === 1 ? "invisible" : "bg-gray-100"
                                }`}
                              >
                                <Minus size={12} />
                              </button>
                              <span>{order.qty}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(itemKey(order), order.qty + 1)
                                }
                                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            Rp{" "}
                            {(order.harga * order.qty).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => hapusItem(itemKey(order))}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded-full"
                            >
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
                <p className="text-lg font-semibold text-black">Total</p>
                <p className="text-highlight text-xl font-bold">
                  Rp {hargaTotal.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                disabled={allOrders.length === 0 || isLoading || !session}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                  allOrders.length === 0 || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-highlight hover:bg-highlight/90"
                }`}
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

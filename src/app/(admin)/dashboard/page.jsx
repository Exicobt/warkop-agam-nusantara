"use client";

import {
  Calendar,
  Clock,
  MapPin,
  Package2,
  ShoppingBag,
  Users,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [menus, setMenus] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMenu();
    fetchOrder();
    fetchTable();                                                                                       
  }, []);

  const fetchMenu = async () => {
    await fetch("/api/menu")
      .then(async (res) => {
        const data = await res.json();
        setMenus(data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const fetchOrder = async () => {
    await fetch("/api/orders")
      .then(async (res) => {
        const data = await res.json();
        setOrders(data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const fetchTable = async () => {
    await fetch("/api/table")
      .then(async (res) => {
        const data = await res.json();
        setTables(data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleButton = async (e) => {
    try {
      setUpdating(true);
      await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...e,
          table_id: e.id,
          status: "available",
          action: "update",
        }),
      });
      toast.success(`Meja ${e.table_number} selesai`);
      fetchTable();
    } catch (err) {
      toast.error("Gagal update data");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Package2 className="w-8 h-8 opacity-80" />
                  <Package className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-2">{menus.length}</div>
                <div className="text-green-100 font-medium">Jumlah Menu</div>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <ShoppingBag className="w-8 h-8 opacity-80" />
                  <Calendar className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-2">{orders.length}</div>
                <div className="text-blue-100 font-medium">
                  Pesanan Hari Ini
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 opacity-80" />
                  <Clock className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-3xl font-bold mb-2">
                  {tables.filter((t) => t.status === "occupied").length}/
                  {tables.length}
                </div>
                <div className="text-orange-100 font-medium">Meja Terisi</div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-500" />
                  Pelanggan
                </h3>
                {orders.length < 1 ? (
                  <div className="h-full w-full py-24 flex justify-center items-center">
                    Tidak Ada Pelanggan
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tables
                      .filter((t) => t.status === "occupied")
                      .map((table) => (
                        <div className="bg-blue-100/30 border-l-4 border-blue-400 rounded-xl p-5 shadow-sm flex items-center gap-5 gird grid-cols-2">
                          <div>
                            <Users size={26} className="text-blue-400" />
                          </div>
                          <div className="space-y-2 w-full">
                            <div className="flex gap-5 items-center">
                              <div className="font-semibold text-base">
                                Meja {table.table_number}
                              </div>
                              <div className="text-sm capitalize bg-blue-200 px-3 p-1 text-blue-500 rounded-full">
                                {table.status}
                              </div>
                            </div>
                            <div className="flex gap-3">
                              <div className="text-sm text-gray-600 capitalize">
                                {String(table.location).replace("_", " ")}
                              </div>
                              <div className="text-sm text-gray-600 capitalize">
                                {(() => {
                                  const order = orders.find(
                                    (order) =>
                                      order.customers.table.id === table.id
                                  );
                                  return order
                                    ? order.customers.name
                                    : "Tidak diketahui";
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="h-full justify-self-end">
                            <button
                              onClick={() => handleButton(table)}
                              disabled={updating}
                              className="px-4 py-1 bg-blue-400 rounded-full text-white text-base cursor-pointer disabled:opacity-50"
                            >
                              {updating ? "..." : "Selesai"}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

'use client'

import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from 'react-hot-toast'
import { Package } from "@phosphor-icons/react/dist/ssr";

const CardMenu = ({ view, data, onOrder }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (data && data.length > 0) {
      setIsLoading(false);
    }
  }, [data]);

  const getMenu = (menu) => {
    onOrder(menu);
    toast.success(`Menambahkan ${menu.nama}`);
  };

  // Fungsi untuk menampilkan placeholder khusus untuk kombo
  const renderImageOrPlaceholder = (item) => {
    // Jika kategori adalah 'combo', tampilkan placeholder dengan ikon
    if (item.kategori === "combo" || item.type === "combo") {
      return (
        <div className={`${view === "grid" ? "w-full h-48" : "w-20 h-20"} bg-orange-50 flex flex-col items-center justify-center p-4`}>
          <Package size={view === "grid" ? 48 : 24} className="text-orange-400 mb-2" />
          <span className={`font-medium text-orange-600 text-center ${view === "grid" ? "text-sm" : "text-xs"}`}>
            Kombo Menu
          </span>
        </div>
      );
    }
    
    // Jika bukan kombo, tampilkan gambar seperti biasa
    return (
      <Image
        src={item?.gambar || "https://placehold.co/1000x1000/png"}
        alt={item?.nama || "Menu"}
        width={view === "grid" ? 400 : 80}
        height={view === "grid" ? 400 : 80}
        className={`${view === "grid" ? "w-full h-48 object-cover" : "w-20 h-20 object-cover"}`}
      />
    );
  };

  // Fungsi untuk menampilkan badge kombo
  const renderComboBadge = (item) => {
    if (item.kategori === "combo" || item.type === "combo") {
      return (
        <div className="absolute top-2 left-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium z-10">
          <Package size={12} className="inline mr-1" />
          Kombo
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${
        view === "list" ? "flex flex-col" : "grid grid-cols-2 md:grid-cols-4"
      } w-full gap-5`}
    >
      {isLoading
        ? [...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <Skeleton className="h-48 w-full rounded" />
            </div>
          ))
        : data.map((item, index) => (
            <div
              className={`${
                view === "grid"
                  ? "flex flex-col pb-5"
                  : "flex w-full items-center"
              } shadow rounded-sm overflow-hidden gap-3 bg-white relative`}
              key={index}
            >
              {/* Tampilkan badge untuk kombo */}
              {renderComboBadge(item)}
              
              {/* Tampilkan gambar atau placeholder untuk kombo */}
              <div className={`${view === "grid" ? "w-full relative" : ""}`}>
                {renderImageOrPlaceholder(item)}
              </div>
              
              <div
                className={`px-4 flex gap-4 w-full h-full justify-between ${
                  view === "grid" ? "flex-col" : ""
                }`}
              >
                <div className="text-sm flex flex-col justify-between h-full w-full gap-2">
                  <div>
                    <h2 className="text-left capitalize font-semibold">
                      {item?.nama}
                    </h2>
                    {/* Tampilkan item-item dalam kombo jika ada */}
                    {item.items && item.items.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.items.slice(0, 2).map(i => i.menu?.nama || i.name).join(' + ')}
                        {item.items.length > 2 && ' + ...'}
                      </p>
                    )}
                  </div>
                  <p className="text-left text-highlight font-semibold">
                    Rp {parseInt(item?.harga).toLocaleString("id-ID")}
                  </p>
                </div>
                <button
                  onClick={() => getMenu(item)}
                  className="bg-highlight text-white px-4 py-2 rounded font-semibold cursor-pointer text-sm hover:bg-highlight/90 transition-colors"
                >
                  Tambah
                </button>
              </div>
            </div>
          ))}
    </div>
  );
};

export default CardMenu;
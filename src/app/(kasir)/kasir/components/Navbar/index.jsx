"use client";

import { useState } from "react";
// 1. Kita import icon jam (ClockCounterClockwise) buat history
import { List, SquaresFour, ListBullets, X, SignOut, ClockCounterClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

const Navbar = ({ placeholder, view, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const changeView = () => {
    setView(view === "grid" ? "list" : "grid");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 2. Fungsi buat pindah ke halaman History
  const handleHistory = () => {
    router.push("/kasir/history"); // Pastikan rute ini sesuai sama folder structure kamu ya!
    closeMenu(); // Biar menu-nya nutup sendiri abis diklik
  };

  const handleLogout = async () => {
    // Bisa tambahin loading state disini kalo mau fancy
    await fetch("/api/logout", {
      method: "POST",
    });
    router.push("/");
  };

  return (
    <>
      <nav className="bg-highlight fixed top-0 w-full flex h-14 px-10 justify-between items-center z-[999]">
        <button onClick={toggleMenu} className="relative z-[1000]">
          {isMenuOpen ? <X size={20} color="white" /> : <List size={20} color="white" />}
        </button>

        <button onClick={changeView} className="cursor-pointer">
          {view === "list" ? <ListBullets size={20} color="white" /> : <SquaresFour size={20} color="white" />}
        </button>
      </nav>

      {/* Overlay Gelap */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/80 bg-opacity-50 z-[998]" onClick={closeMenu} />}

      {/* Sidebar Sliding */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-[999] ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="pt-16 p-6 flex flex-col h-full">
          {/* Bagian Menu Utama */}
          <div className="space-y-2 flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">Menu Kasir</h3>

            {/* --- TOMBOL HISTORY BARU --- */}
            <button onClick={handleHistory} className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 group">
              <ClockCounterClockwise size={24} className="text-gray-500 group-hover:text-blue-600" />
              <span className="font-medium">History Pemesanan</span>
            </button>
            {/* --------------------------- */}
          </div>

          {/* Bagian Footer (Logout) */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
              <SignOut size={24} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;

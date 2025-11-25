"use client";

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

export default function DashboardLayout({ children }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    // HAPUS class 'flex' di container utama biar numpuk ke bawah (Block)
    <div className="min-h-screen bg-gray-50">
      {/* 1. Navbar Taruh Paling Atas (Di luar Flex Sidebar) */}
      {/* Kasih z-index tinggi biar gak ketimpa scroll konten */}
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      {/* 2. Wrapper baru buat Sidebar & Konten biar sebelahan */}
      <div className="flex">
        {/* Sidebar biasanya Fixed position di komponennya, 
            jadi kita taruh di sini */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Konten Utama */}
        {/* ml-64 (margin-left 256px) itu asumsinya lebar Sidebar kamu w-64 fixed */}
        <div className="flex-1 ml-64">
          <main className="p-2">{children}</main>
        </div>
      </div>
    </div>
  );
}

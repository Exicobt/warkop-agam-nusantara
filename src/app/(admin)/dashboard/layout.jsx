"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [drawerPath, setDrawerPath] = useState(null);

  // Drawer mobile terbuka hanya untuk path tempat ia dibuka -> otomatis tertutup saat pindah halaman.
  const drawerOpen = drawerPath === pathname;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => e.key === "Escape" && setDrawerPath(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={drawerOpen} onClose={() => setDrawerPath(null)} />

      <div className="lg:pl-64 print:pl-0">
        <Navbar onMenuClick={() => setDrawerPath(pathname)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

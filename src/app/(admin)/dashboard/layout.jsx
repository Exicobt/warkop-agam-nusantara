"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Urutan penting: route yang lebih spesifik dicek lebih dulu.
const TAB_BY_PREFIX = [
  ["/dashboard/kombo_menu", "kombo_menu"],
  ["/dashboard/menu", "menu"],
  ["/dashboard/table", "tables"],
  ["/dashboard/history", "history"],
];

function tabFromPath(pathname) {
  const match = TAB_BY_PREFIX.find(([prefix]) => pathname.startsWith(prefix));
  return match ? match[1] : "dashboard";
}

export default function DashboardLayout({ children }) {
  // Tab aktif diturunkan dari URL, jadi tetap benar saat reload / tombol back.
  const activeTab = tabFromPath(usePathname());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>

      <div className="flex">
        <Sidebar activeTab={activeTab} />

        {/* ml-64 = lebar Sidebar (w-64, fixed) */}
        <div className="flex-1 ml-64">
          <main className="p-2">{children}</main>
        </div>
      </div>
    </div>
  );
}

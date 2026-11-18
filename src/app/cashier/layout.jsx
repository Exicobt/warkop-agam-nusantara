"use client";

import KasirNavbar from "./components/Navbar";

export default function DashboardLayout({ children }) {

  return (
    // HAPUS class 'flex' di container utama biar numpuk ke bawah (Block)
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50">
        <KasirNavbar />
      </div>


      <main className="p-2">{children}</main>
    </div>
  );
}

"use client";

import { Menu, Bell, Search, Store, ChevronDown, User, Loader2, X, Receipt, Clock, LogOut, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const KasirNavbar = () => {
  // --- STATE SEARCH ---  const [isLoading, setIsLoading] = useState(false);



  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[50] w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex justify-between items-center transition-all duration-300">
        {/* --- KIRI: BRAND & MENU TOGGLE --- */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-gray-100 lg:hidden text-gray-600 transition-colors">
            <Menu size={24} />
          </button>
          <Link href="/kasir" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-400 p-2 rounded-lg shadow-lg shadow-green-200 group-hover:scale-105 transition-transform duration-300">
              <ShoppingCart size={20} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-lg leading-tight tracking-tight">
                Warkop<span className="text-blue-400">AgamNusantara</span>
              </span>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Kasir Panel</span>
            </div>
          </Link>
        </div>

        {/* --- KANAN: ACTIONS --- */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* --- USER PROFILE --- */}
          <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <User size={18} />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-700 leading-none">Kasir</span>
            </div>
            <div className="relative">
              <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
              
              {/* Dropdown Profile */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                <div className="py-2">
    
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      
    </>
  );
};

export default KasirNavbar;
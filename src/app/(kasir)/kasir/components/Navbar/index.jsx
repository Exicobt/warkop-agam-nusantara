"use client";

import { Menu, Store, Grid3x3, List, LogOut, User, Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KasirNavbar = ({ view, setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleView = () => {
    setView(view === "grid" ? "list" : "grid");
  };
  
  return (
    <>
      {/* Main Navbar */}
      <nav className="fixed top-0 z-50 w-full h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 flex justify-between items-center shadow-sm">
        
        {/* LEFT: Brand & Menu Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-blue-400 p-2 rounded-lg shadow-md shadow-green-200">
              <Store size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 text-lg">
                Warkop<span className="text-blue-600">AgamNusantara</span>
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Order Panel
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: View Toggle Buttons */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === "grid" ? "bg-white shadow-sm text-blue-400" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Grid3x3 size={18} />
            <span className="text-sm font-medium">Grid</span>
          </button>
          
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${view === "list" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <List size={18} />
            <span className="text-sm font-medium">List</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default KasirNavbar;
"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation"; // <--- Disable dulu di preview
import { Lock, User, CreditCard, Utensils, Coffee, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const [role, setRole] = useState("kasir");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // const router = useRouter(); // <--- Disable di preview

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username wajib diisi bestie!";
    else if (username.length < 3) newErrors.username = "Pendek amat, minimal 3 huruf lah.";

    if (!password) newErrors.password = "Password jangan kosong dong.";
    else if (password.length < 6) newErrors.password = "Password minimal 6 karakter ya.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const toastId = toast.loading("Sedang memverifikasi...");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login gagal. Coba lagi deh.");
      }

      toast.success(`Selamat datang, ${role}!`, { id: toastId });

      setTimeout(() => {
        if (role === "admin") window.location.href = "/dashboard";
        if (role === "kasir") window.location.href = "/kasir";
        if (role === "dapur") window.location.href = "/dapur";
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Ada masalah teknis nih.", { id: toastId });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* --- BAGIAN KIRI: VISUAL WARKOP --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative justify-center items-center overflow-hidden">
        {/* 1. Overlay Gelap (Biar tulisan kebaca) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/60 z-10"></div>

        {/* 2. GAMBAR BACKGROUND WARKOP */}
        {/* Ganti src ini dengan path foto kamu sendiri kalau ada, misal: "/images/warkop-asli.jpg" */}
        <img src="/foto-warkop.jpg" alt="Suasana Warkop" className="absolute inset-0 w-full h-full object-cover opacity-60" />

        {/* Content Kiri */}
        <div className="relative z-20 text-center px-12">
          <div className="mb-6 inline-flex p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
            <Coffee size={48} className="text-orange-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            Warkop <span className="text-orange-400">Agam Nusantara</span>
          </h1>
          <p className="text-slate-200 text-lg max-w-md mx-auto leading-relaxed font-medium drop-shadow-md">"Satu cangkir kopi, sejuta inspirasi. Kelola pesanan dengan hati, biar pelanggan datang lagi." ☕</p>

          <div className="mt-12 flex justify-center gap-2">
            <div className="w-16 h-1 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
            <div className="w-4 h-1 bg-slate-500 rounded-full"></div>
            <div className="w-4 h-1 bg-slate-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- BAGIAN KANAN: FORM LOGIN --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-left">
            <h2 className="text-3xl font-bold text-slate-900">Selamat Datang! 👋</h2>
            <p className="text-slate-500 mt-2">Masuk untuk mulai mengelola Warkop Agam Nusantara.</p>
          </div>

          {/* Role Selector */}
          <div className="bg-slate-50 p-1.5 rounded-xl flex border border-slate-200">
            {["admin", "kasir", "dapur"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                  role === r ? "bg-white text-orange-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {r === "admin" && <User size={16} />}
                {r === "kasir" && <CreditCard size={16} />}
                {r === "dapur" && <Utensils size={16} />}
                <span className="capitalize">{r}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-3 bg-white border ${
                      errors.username ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-orange-500 focus:ring-orange-100"
                    } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                    placeholder="Masukkan username"
                    disabled={isLoading}
                  />
                </div>
                {errors.username && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.username}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-3 bg-white border ${
                      errors.password ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-orange-500 focus:ring-orange-100"
                    } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-200 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-200 ${
                isLoading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Masuk Sekarang</span>
                  <ArrowRight size={18} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2025 Warkop Agam Nusantara System. <br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

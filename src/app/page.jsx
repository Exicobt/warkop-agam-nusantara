"use client";

import { useState } from "react";
import { Lock, User, Coffee, ArrowRight, AlertCircle, CheckCircle, Mail, X } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email wajib diisi bestie!";
    else if (!email.includes("@")) newErrors.email = "Format email tidak valid.";

    if (!password) newErrors.password = "Password jangan kosong dong.";
    else if (password.length < 6) newErrors.password = "Password minimal 6 karakter ya.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      showNotification("Email harus diisi!", "error");
      return;
    }

    if (!resetEmail.includes("@")) {
      showNotification("Format email tidak valid!", "error");
      return;
    }

    setResetLoading(true);
    showNotification("Mengirim email reset password...", "loading");

    try {
      // Menggunakan Firebase REST API untuk forgot password
      const response = await fetch(
        "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=AIzaSyD7F6dJWgUdYF_EAXqqQWpSnK52YbNEDa4",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email: resetEmail.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Gagal mengirim email reset");
      }

      showNotification(
        "Email reset password telah dikirim! Cek inbox atau spam folder Anda.",
        "success"
      );
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error) {
      console.error("Forgot password error:", error);

      let errorMessage = "Gagal mengirim email reset. Coba lagi ya!";
      
      // Error handling spesifik Firebase
      if (error.message.includes("EMAIL_NOT_FOUND")) {
        errorMessage = "Email tidak terdaftar dalam sistem.";
      } else if (error.message.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
        errorMessage = "Terlalu banyak percobaan. Silakan coba lagi nanti.";
      } else if (error.message.includes("INVALID_EMAIL")) {
        errorMessage = "Format email tidak valid.";
      }

      showNotification(errorMessage, "error");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    showNotification("Sedang memverifikasi...", "loading");

    try {
      // Step 1: Login ke Firebase untuk dapetin UID
      const authRes = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD7F6dJWgUdYF_EAXqqQWpSnK52YbNEDa4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        }),
      });

      if (!authRes.ok) {
        const authError = await authRes.json();
        let errorMessage = "Login gagal!";
        
        if (authError.error?.message === "EMAIL_NOT_FOUND") {
          errorMessage = "Email tidak terdaftar.";
        } else if (authError.error?.message === "INVALID_PASSWORD") {
          errorMessage = "Password salah!";
        } else if (authError.error?.message === "INVALID_LOGIN_CREDENTIALS") {
          errorMessage = "Email atau password salah!";
        }
        
        showNotification(errorMessage, "error");
        setIsLoading(false);
        return;
      }

      const authData = await authRes.json();
      const uid = authData.localId;

      // Step 2: Kirim ke API backend untuk verifikasi dan ambil role
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, email }),
      });

      if (!res.ok) {
        const data = await res.json();
        showNotification(data.error || "Login gagal!", "error");
        setIsLoading(false);
        return;
      }

      // Ambil data role dari response
      const data = await res.json();
      const userRole = data.role;

      showNotification(`Selamat datang, ${userRole}!`, "success");

      // Redirect berdasarkan role
      setTimeout(() => {
        switch (userRole) {
          case "admin":
            window.location.href = "/dashboard";
            break;
          case "kasir":
            window.location.href = "/cashier";
            break;
          case "dapur":
            window.location.href = "/dapur";
            break;
          default:
            showNotification("Role tidak dikenali!", "error");
            setIsLoading(false);
        }
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      showNotification("Ada masalah teknis nih. Coba lagi ya!", "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-[slideIn_0.3s_ease] ${
          notification.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
          notification.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
          notification.type === "loading" ? "bg-blue-50 border-blue-200 text-blue-800" :
          "bg-orange-50 border-orange-200 text-orange-800"
        }`}>
          {notification.type === "loading" && (
            <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          )}
          {notification.type === "error" && <AlertCircle size={20} className="text-red-600" />}
          {notification.type === "success" && <CheckCircle size={20} className="text-green-600" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Modal Forgot Password */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-[modalSlideIn_0.3s_ease]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">Reset Password</h3>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  disabled={resetLoading}
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <p className="text-slate-600 mb-6">
                Masukkan email Anda yang terdaftar. Kami akan mengirimkan link untuk mereset password.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                      placeholder="email@example.com"
                      disabled={resetLoading}
                      onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                    }}
                    className="flex-1 py-3 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all duration-200 disabled:opacity-50"
                    disabled={resetLoading}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-200 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all duration-200 disabled:opacity-70"
                  >
                    {resetLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Mengirim...</span>
                      </div>
                    ) : (
                      "Kirim Reset Link"
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-800">
                  <span className="font-semibold">Tips:</span> Cek folder spam jika email tidak ditemukan di inbox. Link reset berlaku selama 1 jam.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BAGIAN KIRI: VISUAL WARKOP --- */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-black/60 z-10"></div>
        <img src="/foto-warkop.jpg" alt="Suasana Warkop" className="absolute inset-0 w-full h-full object-cover opacity-60" />

        <div className="relative z-20 text-center px-12">
          <div className="mb-6 inline-flex p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-2xl">
            <Coffee size={48} className="text-orange-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            Warkop <span className="text-orange-400">Agam Nusantara</span>
          </h1>
          <p className="text-slate-200 text-lg max-w-md mx-auto leading-relaxed font-medium drop-shadow-md">
            "Satu cangkir kopi, sejuta inspirasi. Kelola pesanan dengan hati, biar pelanggan datang lagi." ☕
          </p>

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

          <div className="space-y-6">
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-4 py-3 bg-white border ${
                      errors.email ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-orange-500 focus:ring-orange-100"
                    } rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                    placeholder="Masukkan email"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline focus:outline-none focus:ring-2 focus:ring-orange-200 rounded px-1.5 py-0.5 transition-all duration-200"
                    disabled={isLoading}
                  >
                    Lupa password?
                  </button>
                </div>
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 font-medium ml-1">{errors.password}</p>}
              </div>
            </div>

            <button
              onClick={handleSubmit}
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

            {/* Info reset password */}
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Jika mengalami kendala login, klik "Lupa password?" di atas atau hubungi admin.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2025 Warkop Agam Nusantara System. <br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
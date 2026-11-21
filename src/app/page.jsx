"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { Lock, Coffee, ArrowRight, AlertCircle, CheckCircle2, Mail, X, Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LOGIN_ERRORS = {
  "auth/invalid-credential": "Email atau password salah!",
  "auth/invalid-email": "Format email tidak valid.",
  "auth/user-disabled": "Akun ini dinonaktifkan. Hubungi admin.",
  "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi nanti.",
  "auth/network-request-failed": "Koneksi bermasalah. Periksa internet Anda.",
};

const homeByRole = { admin: "/dashboard", kasir: "/cashier", dapur: "/dapur" };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const notifTimer = useRef(null);

  useEffect(() => () => clearTimeout(notifTimer.current), []);

  const showNotification = (message, type = "info") => {
    clearTimeout(notifTimer.current);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => setNotification(null), type === "loading" ? 15000 : 4000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email wajib diisi.";
    else if (!EMAIL_RE.test(email.trim())) newErrors.email = "Format email tidak valid.";

    if (!password) newErrors.password = "Password wajib diisi.";
    else if (password.length < 6) newErrors.password = "Password minimal 6 karakter.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    const targetEmail = resetEmail.trim();
    if (!targetEmail) {
      showNotification("Email harus diisi!", "error");
      return;
    }
    if (!EMAIL_RE.test(targetEmail)) {
      showNotification("Format email tidak valid!", "error");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
    } catch (error) {
      // Untuk alasan keamanan, "email tidak terdaftar" tidak dibedakan agar
      // tidak bisa dipakai menebak email staf yang valid.
      if (error.code === "auth/too-many-requests") {
        showNotification("Terlalu banyak percobaan. Silakan coba lagi nanti.", "error");
        setResetLoading(false);
        return;
      }
      if (error.code === "auth/invalid-email") {
        showNotification("Format email tidak valid.", "error");
        setResetLoading(false);
        return;
      }
      console.error("Forgot password error:", error);
    }

    showNotification(
      "Jika email terdaftar, link reset password telah dikirim. Cek inbox atau folder spam.",
      "success"
    );
    setShowForgotPassword(false);
    setResetEmail("");
    setResetLoading(false);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    showNotification("Sedang memverifikasi...", "loading");

    try {
      // 1) Login ke Firebase di browser, ambil ID token
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();

      // 2) Server memverifikasi ID token & menentukan role (klien tidak dipercaya)
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));

      // Sesi Firebase di browser tidak diperlukan lagi setelah cookie server terbit
      await signOut(auth).catch(() => {});

      if (!res.ok) {
        showNotification(data.error || "Login gagal!", "error");
        setIsLoading(false);
        return;
      }

      const destination = homeByRole[data.role];
      if (!destination) {
        showNotification("Role tidak dikenali!", "error");
        setIsLoading(false);
        return;
      }

      showNotification(`Selamat datang, ${data.role}!`, "success");
      // Navigasi penuh agar proxy membaca cookie sesi yang baru
      window.location.assign(destination);
    } catch (error) {
      console.error("Login error:", error);
      showNotification(LOGIN_ERRORS[error.code] || "Ada masalah teknis. Coba lagi ya!", "error");
      setIsLoading(false);
    }
  };


  const toastTone = {
    error: "border-rose-200 bg-rose-50 text-rose-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    loading: "border-gray-200 bg-white text-gray-700",
    info: "border-brand-200 bg-brand-50 text-brand-800",
  };

  return (
    <div className="flex min-h-screen bg-background">
      {notification && (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-rise ${
            toastTone[notification.type] || toastTone.info
          }`}
        >
          {notification.type === "loading" && <Loader2 className="h-4 w-4 animate-spin text-brand-600" />}
          {notification.type === "error" && <AlertCircle className="h-4 w-4 text-rose-600" />}
          {notification.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          {notification.message}
        </div>
      )}

      {/* Modal lupa password */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div role="dialog" aria-label="Reset password" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-rise">
            <div className="mb-2 flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Reset password</h3>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
                disabled={resetLoading}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-5 text-sm text-gray-500">
              Masukkan email terdaftar. Kami akan mengirim tautan untuk mengatur ulang password.
            </p>

            <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reset-email">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
              <input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                disabled={resetLoading}
                placeholder="email@contoh.com"
                className="field py-3 pl-10"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                }}
                disabled={resetLoading}
                className="btn-soft flex-1 py-3"
              >
                Batal
              </button>
              <button onClick={handleForgotPassword} disabled={resetLoading} className="btn-primary flex-1 py-3">
                {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {resetLoading ? "Mengirim…" : "Kirim tautan"}
              </button>
            </div>
            <p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
              Tidak ada email masuk? Periksa folder spam. Tautan berlaku 1 jam.
            </p>
          </div>
        </div>
      )}

      {/* Panel visual */}
      <div className="relative hidden w-1/2 overflow-hidden bg-espresso-950 lg:block">
        <Image src="/foto-warkop.jpg" alt="Suasana Warkop Agam Nusantara" fill priority sizes="50vw" className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso-950 via-espresso-950/50 to-espresso-950/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-espresso-950">
              <Coffee className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">Warkop Agam Nusantara</span>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
              Pesanan rapi, dapur lancar, pelanggan kembali.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-gray-300">
              Satu sistem untuk kasir, dapur, dan manajemen — dari pemesanan lewat QR meja sampai laporan penjualan.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <Coffee className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-semibold text-gray-900">Warkop Agam Nusantara</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Selamat datang</h2>
          <p className="mt-2 text-sm text-gray-500">Masuk dengan akun staf untuk melanjutkan.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={isLoading}
                  autoComplete="username"
                  aria-invalid={!!errors.email}
                  className={`field py-3 pl-10 ${errors.email ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className={`field py-3 pl-10 pr-11 ${errors.password ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi…
                </>
              ) : (
                <>
                  Masuk <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Warkop Agam Nusantara
          </p>
        </div>
      </div>
    </div>
  );
}

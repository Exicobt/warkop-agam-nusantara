"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ReceiptText } from "lucide-react";

const KasirNavbar = () => {
  const router = useRouter();
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000 * 15);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <header className="border-b border-espresso-700 bg-espresso-900 text-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/cashier" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-espresso-950">
            <ReceiptText className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">Warkop Agam Nusantara</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-brand-300">
              Panel Kasir
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {now && (
            <p className="hidden text-lg font-semibold tabular-nums sm:block">
              {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-espresso-700 px-3.5 py-2 text-sm font-medium text-gray-200 transition hover:bg-espresso-800"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default KasirNavbar;

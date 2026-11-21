"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChefHat, LogOut } from "lucide-react";

const DapurNavbar = () => {
  const router = useRouter();
  const [now, setNow] = useState(null);

  // Jam hanya dirender di klien agar tidak memicu hydration mismatch.
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
    <header className="sticky top-0 z-40 border-b border-espresso-700 bg-espresso-900 text-white">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dapur" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-espresso-950">
            <ChefHat className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">Warkop Agam Nusantara</span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-brand-300">
              Layar Dapur
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {now && (
            <div className="hidden text-right sm:block">
              <p className="text-lg font-semibold leading-none tabular-nums">
                {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
              </p>
            </div>
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

export default DapurNavbar;

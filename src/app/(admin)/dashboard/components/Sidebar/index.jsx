"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChefHat,
  History,
  LayoutDashboard,
  Layers,
  LineChart,
  Store,
  Table2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_GROUPS = [
  {
    label: "Ringkasan",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operasional",
    items: [
      { href: "/dashboard/pesanan", label: "Monitor Pesanan", icon: Activity },
      { href: "/dashboard/history", label: "Riwayat Transaksi", icon: History },
      { href: "/dashboard/table", label: "Kelola Meja", icon: Table2 },
    ],
  },
  {
    label: "Katalog",
    items: [
      { href: "/dashboard/menu", label: "Menu", icon: ChefHat },
      { href: "/dashboard/kombo_menu", label: "Kombo Menu", icon: Layers },
    ],
  },
  {
    label: "Laporan",
    items: [{ href: "/dashboard/laporan", label: "Laporan Penjualan", icon: LineChart }],
  },
];

export const isActivePath = (pathname, item) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

function NavList() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-espresso-700 text-white"
                        : "text-gray-400 hover:bg-espresso-800 hover:text-gray-100"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-brand-400" />
                    )}
                    <item.icon
                      className={cn("h-[18px] w-[18px]", active ? "text-brand-300" : "text-gray-500 group-hover:text-gray-300")}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-espresso-950">
        <Store className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-tight text-white">Warkop Agam</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-brand-300">
          Panel Admin
        </span>
      </span>
    </Link>
  );
}

const Sidebar = ({ open, onClose }) => (
  <>
    {/* Desktop */}
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 print:!hidden flex-col border-r border-espresso-700 bg-espresso-900 lg:flex">
      <Brand />
      <NavList />
      <p className="px-5 py-4 text-[11px] text-gray-600">Sistem Informasi Manajemen · v1</p>
    </aside>

    {/* Mobile drawer */}
    <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-espresso-900 shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="absolute right-3 top-4 rounded-lg p-2 text-gray-400 hover:bg-espresso-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <Brand />
        <NavList />
      </aside>
    </div>
  </>
);

export default Sidebar;

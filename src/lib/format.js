// Helper format & tanggal yang dipakai bersama oleh seluruh panel.

export const TIME_ZONE = "Asia/Jakarta";

export const formatRupiah = (amount) =>
  Number(amount || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

export const formatCompactRupiah = (amount) => {
  const n = Number(amount || 0);
  if (Math.abs(n) >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  if (Math.abs(n) >= 1_000) return `Rp${Math.round(n / 1_000)}rb`;
  return `Rp${n}`;
};

export const formatNumber = (n) => Number(n || 0).toLocaleString("id-ID");

export const formatTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

export const formatDate = (value, opts = { day: "2-digit", month: "short", year: "numeric" }) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", opts);
};

export const formatDateTime = (value) => `${formatDate(value)} · ${formatTime(value)}`;

/** Selisih menit dari sekarang → "5 mnt", "1 j 20 mnt". */
export const formatElapsed = (value, now = Date.now()) => {
  const mins = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt`;
  const h = Math.floor(mins / 60);
  return `${h} j ${mins % 60} mnt`;
};

export const minutesSince = (value, now = Date.now()) =>
  Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000));

/* ---------- Tanggal (zona waktu lokal browser) ---------- */

export const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Kunci tanggal lokal "YYYY-MM-DD" (bukan UTC, agar tidak meleset pada dini hari). */
export const dateKey = (value) => {
  const d = new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Nilai untuk <input type="date">. */
export const toInputDate = (date) => dateKey(date);

/** Parse "YYYY-MM-DD" sebagai tanggal LOKAL. */
export const fromInputDate = (str) => {
  const [y, m, d] = String(str).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/* ---------- Status pesanan ---------- */

export const STATUS_META = {
  pending: { label: "Menunggu Kasir", tone: "amber", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 ring-amber-200" },
  waiting: { label: "Antre Dapur", tone: "sky", dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700 ring-sky-200" },
  preparing: { label: "Dimasak", tone: "violet", dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 ring-violet-200" },
  done: { label: "Siap Disajikan", tone: "emerald", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  finish: { label: "Selesai", tone: "stone", dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 ring-gray-200" },
  cancelled: { label: "Dibatalkan", tone: "rose", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const statusMeta = (status) => STATUS_META[status] || STATUS_META.pending;

export const CATEGORY_LABEL = { foods: "Makanan", drinks: "Minuman", snacks: "Camilan" };

/** Nomor meja "0"/kosong dianggap take away. */
export const tableLabel = (order) => {
  const n = order?.customers?.table?.table_number;
  return n && n !== "0" ? `Meja ${n}` : "Take Away";
};

/** Unduh array-of-array sebagai CSV (Excel-friendly dengan BOM). */
export function downloadCsv(filename, rows) {
  const escape = (v) => {
    const s = String(v ?? "");
    // Cegah CSV injection saat dibuka di Excel
    const safe = /^[=+\-@]/.test(s) && Number.isNaN(Number(s)) ? `'${s}` : s;
    return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

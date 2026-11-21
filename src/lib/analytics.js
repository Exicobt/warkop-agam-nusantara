// Perhitungan laporan (MIS) murni di sisi klien dari daftar pesanan.
// Omzet hanya dihitung dari pesanan berstatus "finish" (sudah dibayar).
import { CATEGORY_LABEL, addDays, dateKey, startOfDay } from "@/lib/format";

export const isPaid = (o) => o.status === "finish";

const orderTotal = (o) =>
  o.total ?? (o.orders || []).reduce((sum, item) => sum + (item.total || 0), 0);

export function inRange(orders, from, to) {
  const f = from ? new Date(from).getTime() : -Infinity;
  const t = to ? new Date(to).getTime() : Infinity;
  return orders.filter((o) => {
    const ts = new Date(o.create_at).getTime();
    return ts >= f && ts <= t;
  });
}

export function summarize(orders) {
  const paid = orders.filter(isPaid);
  const revenue = paid.reduce((s, o) => s + orderTotal(o), 0);
  const items = paid.reduce(
    (s, o) => s + (o.orders || []).reduce((n, i) => n + (i.qty || 0), 0),
    0
  );
  const cancelled = orders.filter((o) => o.status === "cancelled").length;
  const active = orders.filter((o) => ["pending", "waiting", "preparing", "done"].includes(o.status)).length;
  return {
    revenue,
    transactions: paid.length,
    items,
    aov: paid.length ? Math.round(revenue / paid.length) : 0,
    cancelled,
    cancelRate: orders.length ? (cancelled / orders.length) * 100 : 0,
    active,
    total: orders.length,
  };
}

/** Persentase perubahan; null bila pembanding 0 (tak bermakna). */
export function delta(current, previous) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / previous) * 100;
}

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/** Omzet per hari, terisi nol untuk hari tanpa transaksi. */
export function revenueByDay(orders, from, to) {
  const map = new Map();
  const start = startOfDay(from);
  const end = startOfDay(to);
  for (let d = start; d <= end; d = addDays(d, 1)) {
    map.set(dateKey(d), {
      key: dateKey(d),
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      weekday: DAY_SHORT[d.getDay()],
      revenue: 0,
      transactions: 0,
      items: 0,
      cancelled: 0,
    });
  }
  for (const o of orders) {
    const row = map.get(dateKey(o.create_at));
    if (!row) continue;
    if (isPaid(o)) {
      row.revenue += orderTotal(o);
      row.transactions += 1;
      row.items += (o.orders || []).reduce((n, i) => n + (i.qty || 0), 0);
    } else if (o.status === "cancelled") {
      row.cancelled += 1;
    }
  }
  return [...map.values()];
}

/** Jam sibuk: jumlah transaksi & omzet per jam (0-23). */
export function byHour(orders) {
  const rows = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, "0")}`,
    transactions: 0,
    revenue: 0,
  }));
  for (const o of orders) {
    if (!isPaid(o)) continue;
    const h = new Date(o.create_at).getHours();
    rows[h].transactions += 1;
    rows[h].revenue += orderTotal(o);
  }
  return rows;
}

export function byCategory(orders) {
  const acc = {};
  for (const o of orders) {
    if (!isPaid(o)) continue;
    for (const item of o.orders || []) {
      const key = item.menu?.kategori || "lainnya";
      acc[key] ||= { key, name: CATEGORY_LABEL[key] || "Lainnya", revenue: 0, qty: 0 };
      acc[key].revenue += item.total || 0;
      acc[key].qty += item.qty || 0;
    }
  }
  return Object.values(acc).sort((a, b) => b.revenue - a.revenue);
}

export function byPayment(orders) {
  const acc = {};
  for (const o of orders) {
    if (!isPaid(o)) continue;
    const name = o.payment_method?.name || "Belum dicatat";
    acc[name] ||= { name, revenue: 0, transactions: 0 };
    acc[name].revenue += orderTotal(o);
    acc[name].transactions += 1;
  }
  return Object.values(acc).sort((a, b) => b.revenue - a.revenue);
}

export function byType(orders) {
  const acc = {
    dine_in: { key: "dine_in", name: "Makan di Tempat", revenue: 0, transactions: 0 },
    take_away: { key: "take_away", name: "Take Away", revenue: 0, transactions: 0 },
  };
  for (const o of orders) {
    if (!isPaid(o)) continue;
    const key = o.tipe_order === "take_away" ? "take_away" : "dine_in";
    acc[key].revenue += orderTotal(o);
    acc[key].transactions += 1;
  }
  return Object.values(acc);
}

export function topMenus(orders, limit = 5) {
  const acc = new Map();
  for (const o of orders) {
    if (!isPaid(o)) continue;
    for (const item of o.orders || []) {
      const name = item.menu?.nama || "Menu dihapus";
      const row = acc.get(name) || {
        name,
        kategori: item.menu?.kategori,
        qty: 0,
        revenue: 0,
      };
      row.qty += item.qty || 0;
      row.revenue += item.total || 0;
      acc.set(name, row);
    }
  }
  const rows = [...acc.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
  return limit ? rows.slice(0, limit) : rows;
}

import prisma from "@/lib/prisma";

/**
 * State machine pesanan.
 *   pending -> waiting (kasir terima) -> preparing (dapur masak) -> done (siap)
 *           -> finish (kasir: dibayar)
 *   pending/waiting -> cancelled
 *
 * Nilai di bawah = role yang boleh melakukan transisi tersebut.
 */
const TRANSITIONS = {
  pending: { waiting: ["kasir", "admin"], cancelled: ["kasir", "admin"] },
  waiting: { preparing: ["dapur", "admin"], cancelled: ["kasir", "admin"] },
  preparing: { done: ["dapur", "admin"] },
  done: { finish: ["kasir", "admin"] },
};

/**
 * Ubah status pesanan secara atomik beserta efek sampingnya:
 *  - waiting   : meja (jika ada) -> occupied
 *  - cancelled : meja (jika ada) -> available
 *  - finish    : meja -> available, dan statistik menu bertambah
 *
 * @returns {{ ok: true, basket: object } | { ok: false, status: number, error: string }}
 */
export async function transitionOrder(basketId, nextStatus, role) {
  const basket = await prisma.basket.findUnique({
    where: { id: basketId },
    include: {
      customers: { select: { table_id: true } },
      orders: { select: { menu_id: true, qty: true } },
    },
  });

  if (!basket) {
    return { ok: false, status: 404, error: "Pesanan tidak ditemukan." };
  }

  const allowedRoles = TRANSITIONS[basket.status]?.[nextStatus];
  if (!allowedRoles) {
    return {
      ok: false,
      status: 400,
      error:
        nextStatus === "cancelled"
          ? "Pesanan sudah diproses dapur, tidak bisa dibatalkan."
          : `Status tidak bisa diubah dari "${basket.status}" ke "${nextStatus}".`,
    };
  }
  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      status: 403,
      error: "Role Anda tidak boleh melakukan perubahan status ini.",
    };
  }

  const tableId = basket.customers?.table_id ?? null;

  const updated = await prisma.$transaction(async (tx) => {
    // Update bersyarat: cegah race jika dua staf menekan tombol bersamaan.
    const { count } = await tx.basket.updateMany({
      where: { id: basketId, status: basket.status },
      data: { status: nextStatus },
    });
    if (count !== 1) return null;

    if (tableId) {
      if (nextStatus === "waiting") {
        await tx.table.update({
          where: { id: tableId },
          data: { status: "occupied" },
        });
      } else if (nextStatus === "cancelled" || nextStatus === "finish") {
        await tx.table.update({
          where: { id: tableId },
          data: { status: "available" },
        });
      }
    }

    if (nextStatus === "finish") {
      for (const item of basket.orders) {
        if (!item.menu_id) continue;
        await tx.menu_stats.upsert({
          where: { menu_id: item.menu_id },
          update: { quantity: { increment: item.qty } },
          create: { menu_id: item.menu_id, quantity: item.qty },
        });
      }
    }

    return await tx.basket.findUnique({ where: { id: basketId } });
  });

  if (!updated) {
    return {
      ok: false,
      status: 409,
      error: "Status pesanan baru saja diubah oleh pengguna lain. Muat ulang data.",
    };
  }

  return { ok: true, basket: updated };
}

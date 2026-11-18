import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { transitionOrder } from "@/lib/order-status";
import { toPositiveInt } from "@/lib/validation";

export async function PATCH(request, { params }) {
  const auth = await requireRole(request, ["admin", "kasir"]);
  if (auth.error) return auth.error;

  const { id } = await params;
  const orderId = toPositiveInt(id);
  if (!orderId) {
    return NextResponse.json({ message: "ID pesanan tidak valid" }, { status: 400 });
  }

  try {
    const result = await transitionOrder(orderId, "cancelled", auth.session.role);
    if (!result.ok) {
      return NextResponse.json({ message: result.error, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: "Pesanan berhasil dibatalkan", data: result.basket });
  } catch (error) {
    console.error("Gagal cancel order:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

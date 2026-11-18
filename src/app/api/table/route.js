import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import {
  TABLE_STATUSES,
  prismaErrorStatus,
  readJson,
  toCleanString,
  toPositiveInt,
} from "@/lib/validation";

// Staf saja. Token QR tidak ikut dikirim ke klien.
export async function GET(request) {
  const auth = await requireRole(request, ["admin", "kasir", "dapur"]);
  if (auth.error) return auth.error;

  try {
    const tables = await prisma.table.findMany({
      select: {
        id: true,
        table_number: true,
        status: true,
        qr_generated_at: true,
      },
    });
    // Urut numerik bila nomor meja angka ("2" sebelum "10")
    tables.sort((a, b) =>
      String(a.table_number).localeCompare(String(b.table_number), undefined, { numeric: true })
    );
    return NextResponse.json(tables);
  } catch (err) {
    console.error("GET /api/table:", err);
    return NextResponse.json({ error: "Gagal mengambil data meja" }, { status: 500 });
  }
}

export async function POST(req) {
  const body = await readJson(req);
  const { action } = body;

  // Kasir boleh mengubah status meja; membuat/menghapus/mengganti nomor hanya admin.
  const auth = await requireRole(
    req,
    action === "update" && body.table_number === undefined ? ["admin", "kasir"] : ["admin"]
  );
  if (auth.error) return auth.error;

  try {
    if (action === "create") {
      const table_number = toCleanString(String(body.table_number ?? ""), 10);
      if (!table_number) {
        return NextResponse.json({ error: "Nomor meja wajib diisi (maks. 10 karakter)" }, { status: 400 });
      }
      const status = TABLE_STATUSES.includes(body.status) ? body.status : "available";
      const created = await prisma.table.create({ data: { table_number, status } });
      return NextResponse.json(created, { status: 201 });
    }

    if (action === "update") {
      const id = toPositiveInt(body.table_id);
      if (!id) return NextResponse.json({ error: "table_id tidak valid" }, { status: 400 });

      const data = {};
      if (body.status !== undefined) {
        if (!TABLE_STATUSES.includes(body.status)) {
          return NextResponse.json({ error: "Status meja tidak valid" }, { status: 400 });
        }
        data.status = body.status;
      }
      if (body.table_number !== undefined) {
        const table_number = toCleanString(String(body.table_number), 10);
        if (!table_number) {
          return NextResponse.json({ error: "Nomor meja tidak valid" }, { status: 400 });
        }
        data.table_number = table_number;
      }

      const updated = await prisma.table.update({ where: { id }, data });
      return NextResponse.json(updated);
    }

    if (action === "delete") {
      const id = toPositiveInt(body.table_id);
      if (!id) return NextResponse.json({ error: "table_id tidak valid" }, { status: 400 });

      const used = await prisma.customers.count({ where: { table_id: id } });
      if (used > 0) {
        return NextResponse.json(
          { error: "Meja tidak bisa dihapus karena sudah punya riwayat pesanan. Ubah statusnya menjadi tidak tersedia." },
          { status: 409 }
        );
      }
      await prisma.table.delete({ where: { id } });
      return NextResponse.json({ message: "Meja berhasil dihapus" });
    }

    return NextResponse.json({ error: "action tidak dikenal" }, { status: 400 });
  } catch (err) {
    const mapped = prismaErrorStatus(err);
    if (mapped) {
      const message = err.code === "P2002" ? "Nomor meja sudah dipakai" : mapped.message;
      return NextResponse.json({ error: message }, { status: mapped.status });
    }
    console.error("POST /api/table:", err);
    return NextResponse.json({ error: "Gagal memproses data meja" }, { status: 500 });
  }
}

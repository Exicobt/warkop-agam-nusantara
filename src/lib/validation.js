// Helper validasi kecil agar route tidak mempercayai input mentah dari klien.

export const MENU_CATEGORIES = ["foods", "drinks", "snacks"];
export const TABLE_STATUSES = ["available", "occupied", "not_available"];
export const ORDER_STATUSES = [
  "pending",
  "waiting",
  "preparing",
  "done",
  "finish",
  "cancelled",
];

/** Parse JSON body tanpa melempar error; body kosong/rusak -> {} */
export async function readJson(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

/** Integer positif (>0) atau null. Menerima number atau string numerik. */
export function toPositiveInt(value, max = Number.MAX_SAFE_INTEGER) {
  const n = typeof value === "string" ? Number(value.trim()) : value;
  if (!Number.isInteger(n) || n <= 0 || n > max) return null;
  return n;
}

/** String ter-trim dengan batas panjang, atau null bila kosong/tidak valid. */
export function toCleanString(value, maxLength = 255) {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s || s.length > maxLength) return null;
  return s;
}

/** Gambar boleh data URL gambar atau URL http(s); batasi ukuran. */
export const MAX_IMAGE_LENGTH = 2_000_000;
export function isValidImage(value) {
  if (typeof value !== "string" || !value || value.length > MAX_IMAGE_LENGTH) {
    return false;
  }
  return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value) || /^https?:\/\//i.test(value);
}

/** Pemetaan error Prisma umum -> respons yang ramah. */
export function prismaErrorStatus(err) {
  switch (err?.code) {
    case "P2002":
      return { status: 409, message: "Data sudah ada (duplikat)." };
    case "P2003":
      return { status: 409, message: "Data masih dipakai oleh data lain." };
    case "P2025":
      return { status: 404, message: "Data tidak ditemukan." };
    default:
      return null;
  }
}

/** Error terkontrol yang membawa status HTTP (dilempar dari dalam transaksi). */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

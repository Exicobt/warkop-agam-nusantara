/**
 * Perkecil & kompres gambar di browser sebelum disimpan (sebagai data URL).
 * Gambar mentah bisa 5 MB; hasilnya biasanya < 100 KB, sehingga daftar menu
 * tidak lagi membengkak.
 */
export async function compressImage(file, { maxSize = 800, quality = 0.82 } = {}) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  // JPEG tidak mendukung transparansi: isi latar putih agar PNG transparan tidak jadi hitam
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return canvas.toDataURL("image/jpeg", quality);
}

export const MENU_CATEGORY_OPTIONS = [
  { value: "foods", label: "Makanan" },
  { value: "drinks", label: "Minuman" },
  { value: "snacks", label: "Snack" },
];

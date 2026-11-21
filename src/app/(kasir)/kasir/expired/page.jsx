import { QrCode } from "lucide-react";

export const metadata = { title: "QR Tidak Berlaku" };

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
        <QrCode className="mx-auto text-brand-500 mb-4" size={56} />
        <h1 className="text-xl font-bold text-gray-800 mb-2">QR code tidak berlaku</h1>
        <p className="text-gray-600 text-sm">
          QR code ini tidak dikenali (mungkin sudah diganti) atau mejanya sedang tidak tersedia.
          Silakan hubungi kasir.
        </p>
      </div>
    </div>
  );
}

// Hapus `<html>` and `<body>` dari sini
// Biarkan Root Layout (app/layout.jsx) yang mengurus itu

export const metadata = {
  title: "Kasir",
  // Metadata ini akan di-merge dengan metadata root
};

export default function KasirLayout({ children }) {
  return (
    // Kamu bisa pakai <div>, <main>, atau biarin React.Fragment (kosongan)
    // Biar rapi, kita bungkus pakai <main> aja ya
    <main className="w-full h-full">      {children}</main>
  );
}

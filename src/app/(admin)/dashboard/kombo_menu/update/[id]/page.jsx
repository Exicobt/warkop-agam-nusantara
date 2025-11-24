"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Package, X, Search, Plus } from "lucide-react";
import toast from "react-hot-toast";

const UpdateKomboMenu = () => {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [allMenus, setAllMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [searchMenu, setSearchMenu] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    items: []
    });

  // Fetch semua menu untuk dipilih
  const fetchAllMenus = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setAllMenus(data);
      setFilteredMenus(data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data menu");
    }
  };

  const fetchKombo = async () => {
    const res = await fetch(`/api/combo`);
    const data = await res.json();
    const comboItem = data.find((item) => item.id == parseInt(id))
    console.log(comboItem)
    setFormData({
        name: comboItem.name,
        price: parseInt(comboItem.price),
        items: comboItem.items.map((item) => item.menu_id)
    })
    setIsLoading(false);
  };

  // Filter menu berdasarkan pencarian
  useEffect(() => {
    if (searchMenu) {
      const filtered = allMenus.filter(menu =>
        menu.nama.toLowerCase().includes(searchMenu.toLowerCase())
      );
      setFilteredMenus(filtered);
    } else {
      setFilteredMenus(allMenus);
    }
  }, [searchMenu, allMenus]);

  // Hitung total harga individual
  const calculateTotalIndividualPrice = () => {
    return formData.items.reduce((total, menuId) => {
      const menu = allMenus.find(m => m.id === menuId);
      return total + (menu ? menu.harga : 0);
    }, 0);
  };

  // Hitung harga normal (sebelum kombo)
  const hargaNormal = calculateTotalIndividualPrice();

  // Hitung persentase diskon
  const calculateDiscountPercentage = () => {
    if (hargaNormal === 0 || !formData.price) return 0;
    const komboPrice = parseInt(formData.price);
    const discount = ((hargaNormal - komboPrice) / hargaNormal) * 100;
    return Math.round(discount);
  };

  // Tambah menu ke kombo
  const addMenuToKombo = (menu) => {
    if (formData.items.includes(menu.id)) {
      toast.error("Menu sudah ditambahkan");
      return;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, menu.id]
    }));
    setSearchMenu("");
    toast.success(`${menu.nama} ditambahkan`);
  };

  // Hapus menu dari kombo
  const removeMenuFromKombo = (menuId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(id => id !== menuId)
    }));
  };

  // Handle form submit
  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.price || formData.items.length === 0) {
      toast.error("Lengkapi semua field");
      return;
    }

    const res = await fetch(`/api/combo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: parseInt(id),
            name: formData.name,
            price: Number(formData.price),
            items: formData.items,
        }),
    });

    if (res.ok) {
      toast.success("Berhasil memperbarui kombo menu");
      router.push("/dashboard/kombo_menu");
    } else toast.error("Gagal mengupdate kombo menu");
  };

  useEffect(() => {
    fetchAllMenus();
    fetchKombo()
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Update Kombo Menu
                </h1>
                <p className="text-gray-600">
                  Edit paket menu kombinasi dengan harga spesial
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Input */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Nama Kombo */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Informasi Kombo
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Kombo Menu *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Contoh: Nasi Goreng + Es Teh"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>

                      {/* Harga Kombo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Harga Kombo *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            Rp
                          </span>
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0"
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pilih Menu */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Pilih Menu untuk Kombo
                    </h2>
                    
                    {/* Search Menu */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Cari menu..."
                        value={searchMenu}
                        onChange={(e) => setSearchMenu(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    {/* Daftar Menu */}
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredMenus.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Tidak ada menu ditemukan
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredMenus.map((menu) => (
                            <div
                              key={menu.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                              onClick={() => addMenuToKombo(menu)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {menu.nama}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {menu.kategori} • Rp {menu.harga.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Plus className="w-5 h-5 text-green-500" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  {/* Ringkasan Harga */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Ringkasan Harga
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Harga Individual:</span>
                        <span className="font-medium">Rp {hargaNormal.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Harga Kombo:</span>
                        <span className="font-medium text-orange-600">
                          Rp {formData.price ? parseInt(formData.price).toLocaleString() : "0"}
                        </span>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Anda Hemat:</span>
                          <span className="font-medium text-green-600">
                            Rp {(hargaNormal - (formData.price ? parseInt(formData.price) : 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-green-600 font-medium">
                            ({calculateDiscountPercentage()}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Terpilih */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Menu Terpilih ({formData.items.length})
                    </h3>
                    
                    {formData.items.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Belum ada menu dipilih
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formData.items.map((menuId) => {
                          const menu = allMenus.find(m => m.id === menuId);
                          if (!menu) return null;
                          
                          return (
                            <div
                              key={menuId}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                                  <Package className="w-3 h-3 text-orange-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-800">
                                  {menu.nama}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMenuFromKombo(menuId)}
                                className="p-1 hover:bg-red-100 rounded text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tombol Submit */}
                  <button
                    type="submit"
                    disabled={isLoading || formData.items.length < 2}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {isLoading ? "Menyimpan..." : "Simpan Kombo Menu"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateKomboMenu;
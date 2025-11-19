"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";

const UpdateMenu = () => {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({});
  const [menu, setMenu] = useState({});

  const [errors, setErrors] = useState({});

  const categories = ["Food", "Drink", "Snack"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          gambar: "File harus berupa gambar",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          gambar: "Ukuran file maksimal 5MB",
        }));
        return;
      }

      setErrors((prev) => ({
        ...prev,
        gambar: "",
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log(e.target.result);
        setImagePreview(e.target.result);
        setFormData((prev) => ({
          ...prev,
          gambar: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = "Nama makanan wajib diisi";
    }

    if (!formData.kategori) {
      newErrors.kategori = "Kategori wajib dipilih";
    }

    if (!formData.harga) {
      newErrors.harga = "Harga wajib diisi";
    } else if (isNaN(formData.harga) || parseInt(formData.harga) <= 0) {
      newErrors.harga = "Harga harus berupa angka positif";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`/api/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu_id: menu.id,
          ...formData,
          harga: parseInt(formData.harga),
          action: "update",
        }),
      });

      if (response.ok) {
        toast.success("Berhasil update menu");
        router.push("/dashboard/menu");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || "Gagal mengupdate menu" });
      }
    } catch (error) {
      console.error("Error updating menu:", error);
      setErrors({ submit: "Terjadi kesalahan saat mengupdate menu" });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/menu");
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        const menuItem = data.find((item) => item.id === parseInt(id));

        setMenu(menuItem);
        setImagePreview(menuItem.gambar);
        setFormData({
          nama: menuItem.nama,
          harga: menuItem.harga,
          kategori: menuItem.kategori,
          gambar: menuItem.gambar,
        });
      } catch (err) {
        console.error("Error fetching menu:", err);
        setErrors({ fetch: "Gagal memuat data menu" });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMenu();
    }
  }, [id, router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex">
          <div className="flex-1 p-6 h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data menu...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Update Menu
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Perbarui informasi menu makanan
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border-gray-200 p-6 mb-6">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="nama"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nama
                      </label>
                      <input
                        name="nama"
                        onChange={handleInputChange}
                        value={formData.nama}
                        type="text"
                        className="bg-white border border-gray-200 px-4 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="harga"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        harga
                      </label>
                      <input
                        name="harga"
                        onChange={handleInputChange}
                        value={formData.harga}
                        type="number"
                        className="bg-white border border-gray-200 px-4 py-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="kategori"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Kategori
                      </label>
                      <select
                        id="kategori"
                        name="kategori"
                        value={formData.kategori}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      >
                        <option value="">Pilih kategori</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Menu
                    </label>
                    <div className="space-y-4">
                      {imagePreview && (
                        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud
                              size={30}
                              className="mb-3 text-gray-500"
                            />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Klik untuk upload
                              </span>{" "}
                              atau drag & drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, JPEG (Maks. 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    disabled={updating}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer"
                  >
                    {updating && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {updating ? "Menyimpan..." : "Update Menu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateMenu;

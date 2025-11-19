"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { UploadCloud } from "lucide-react";

const TambahMenu = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    harga: "",
    kategori: "",
    gambar: "",
  });

  const [errors, setErrors] = useState({});

  const categories = ["foods", "drinks", "snacks"];

  const handleChange = (e) => {
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
        toast.error("File harus berupa gambar");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          gambar: "Ukuran file maksimal 5MB",
        }));
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      setErrors((prev) => ({
        ...prev,
        gambar: "",
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData((prev) => ({
          ...prev,
          gambar: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
      toast.success("Gambar berhasil dipilih");
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

    if (!formData.gambar) {
      newErrors.gambar = "Gambar wajib diupload";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          harga: parseInt(formData.harga),
          action: "create",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Menu berhasil ditambahkan!");

        setFormData({
          nama: "",
          harga: "",
          kategori: "",
          gambar: "",
        });
        setImagePreview("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setTimeout(() => {
          router.push("/dashboard/menu");
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Gagal menambahkan menu");
      }
    } catch (error) {
      console.error("Error tambah menu:", error);
      toast.error("Terjadi kesalahan saat menambahkan menu");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (Object.values(formData).some((value) => value !== "") || imagePreview) {
      if (
        confirm(
          "Anda yakin ingin membatalkan? Data yang telah diisi akan hilang."
        )
      ) {
        router.push("/dashboard/menu");
      }
    } else {
      router.push("/dashboard/menu");
    }
  };

  const handleBackClick = () => {
    handleCancel();
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Tambah Menu
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Tambah informasi menu makanan baru
                  </p>
                </div>
                <button
                  onClick={handleBackClick}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Form Fields */}
                  <div className="space-y-6">
                    {/* Nama */}
                    <div>
                      <label
                        htmlFor="nama"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nama Makanan *
                      </label>
                      <input
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        type="text"
                        placeholder="Masukkan nama makanan"
                        className={`w-full bg-white border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.nama ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                      {errors.nama && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.nama}
                        </p>
                      )}
                    </div>

                    {/* Harga */}
                    <div>
                      <label
                        htmlFor="harga"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Harga *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">
                          Rp
                        </span>
                        <input
                          id="harga"
                          name="harga"
                          value={formData.harga}
                          onChange={handleChange}
                          type="number"
                          placeholder="0"
                          min="0"
                          className={`w-full bg-white border pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.harga ? "border-red-300" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.harga && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.harga}
                        </p>
                      )}
                    </div>

                    {/* Kategori */}
                    <div>
                      <label
                        htmlFor="kategori"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Kategori *
                      </label>
                      <select
                        id="kategori"
                        name="kategori"
                        value={formData.kategori}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.kategori ? "border-red-300" : "border-gray-300"
                        }`}
                      >
                        <option value="">Pilih kategori</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.kategori && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.kategori}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Menu *
                    </label>
                    <div className="space-y-4">
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview("");
                              setFormData((prev) => ({ ...prev, gambar: "" }));
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      {/* Upload Area */}
                      <div className="flex items-center justify-center w-full">
                        <label
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                            errors.gambar ? "border-red-300" : "border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud
                              size={30}
                              className={`mb-3 ${
                                errors.gambar ? "text-red-400" : "text-gray-500"
                              }`}
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
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                      {errors.gambar && (
                        <p className="text-red-500 text-sm">{errors.gambar}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={updating}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {updating ? "Menyimpan..." : "Tambah Menu"}
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

export default TambahMenu;

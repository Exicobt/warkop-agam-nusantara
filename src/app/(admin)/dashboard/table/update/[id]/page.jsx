"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

const update = () => {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState({});
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState({});
  const [updating, setUpdating] = useState(false);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchTable = async () => {
      const response = await fetch("/api/table");
      const data = await response.json();
      const getData = data.find((i) => i.id === parseInt(id));

      setFormData({
        table_number: parseInt(
          String(getData.table_number).replace(/[a-zA-Z]/g, "")
        ),
        status: getData.status,
        location: String(getData.location).replace("_", " "),
      });
      setTables(data);
      setLoading(false);
      setTable(getData);
    };

    fetchTable();
  }, [id, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.table_number) {
      newErrors.table_number = "Nomor meja wajib diisi";
    }

    if (!formData.status) {
      newErrors.status = "Status wajib dipilih";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleCancel = () => {
    router.push("../");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    const duplicateTable = tables.find(
      (t) =>
        t.table_number === formData.table_number
    );

    if (duplicateTable) {
      if (duplicateTable.id !== table.id) {
        toast.error(
          `Meja dengan nomor ${formData.table_number} sudah ada`
        );
        return;
      }
    }

    setUpdating(true);

    try {
      const res = await fetch("/api/table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table_id: table.id,
          ...formData,
          table_number: String(formData.table_number),
          status: formData.status,
          action: "update",
        }),
      });

      if (res.ok) {
        toast.success("Data berhasil update");
        router.push("../");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex">
          <div className="flex-1 p-6 h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-highlight mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data meja...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="flex pt-16">
        <div className="flex-1 p-6 ">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Update Meja
                  </h1>
                  <p className="text-gray-600 mt-1">Perbarui informasi meja</p>
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
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="table_number"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nomor meja
                      </label>
                      <div className="relative">
                        <input
                          name="table_number"
                          type="number"
                          onChange={handleInputChange}
                          value={parseInt(formData.table_number)}
                          placeholder="Masukkan nomor meja"
                          className={`box-border w-full bg-white border border-gray-200 pl-8 pr-4 py-2 rounded-lg ${
                            errors.table_number
                              ? "border-red-500"
                              : "border-gray-200"
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="lokasi"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Status
                      </label>
                      <select
                        value={formData.status}
                        name="status"
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.status ? "border-red-500" : "border-gray-200"
                        }`}
                      >
                        <option value="available">Tersedia</option>
                        <option value="not_available">Tidak Tersedia</option>
                      </select>

                      {errors.table_number && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.status}
                        </p>
                      )}
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
                    {updating ? "Menyimpan..." : "Update Meja"}
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

export default update;

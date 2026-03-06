"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createMahalla,
  deleteMahalla,
  listMahallas,
  updateMahalla,
  type ApiMahalla
} from "@/lib/api";

export default function SuperAdminMahallasPage() {
  const [mahallas, setMahallas] = useState<ApiMahalla[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyMahallaId, setBusyMahallaId] = useState<string | null>(null);
  const [editingMahallaId, setEditingMahallaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    regionName: "",
    districtName: ""
  });

  const resetForm = () => {
    setEditingMahallaId(null);
    setForm({ name: "", regionName: "", districtName: "" });
  };

  const loadMahallas = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listMahallas({ page: 1, pageSize: 200 });
      setMahallas(response.items);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Mahallalarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMahallas();
  }, []);

  const filtered = useMemo(
    () =>
      mahallas.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.district?.region?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (m.district?.name ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [mahallas, search]
  );

  const handleEdit = (mahalla: ApiMahalla) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingMahallaId(mahalla.id);
    setForm({
      name: mahalla.name,
      regionName: mahalla.district?.region?.name ?? "",
      districtName: mahalla.district?.name ?? ""
    });
  };

  const handleDelete = async (mahalla: ApiMahalla) => {
    const confirmed = window.confirm(`"${mahalla.name}" mahallasini ochirishni tasdiqlaysizmi?`);
    if (!confirmed) {
      return;
    }

    setBusyMahallaId(mahalla.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteMahalla(mahalla.id);
      setSuccessMessage("Mahalla ochirildi.");
      if (editingMahallaId === mahalla.id) {
        resetForm();
      }
      await loadMahallas();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Mahallani ochirishda xatolik.");
      }
    } finally {
      setBusyMahallaId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        regionName: form.regionName.trim(),
        districtName: form.districtName.trim()
      };

      if (editingMahallaId) {
        await updateMahalla(editingMahallaId, payload);
        setSuccessMessage("Mahalla yangilandi.");
      } else {
        await createMahalla(payload);
        setSuccessMessage("Mahalla yaratildi.");
      }

      resetForm();
      await loadMahallas();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(editingMahallaId ? "Mahallani yangilashda xatolik." : "Mahalla yaratishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mahallalar royxati</h1>
          <p className="text-sm text-gray-600">
            Super Admin barcha mahallalarni koradi va CRUD amallarini bajaradi.
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish (nomi, hudud)..."
          className="w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition"
        />
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <h2 className="text-lg font-semibold mb-3">Mahallalar jadvali</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">#</th>
                <th className="border px-2 py-1 text-left">Nomi</th>
                <th className="border px-2 py-1 text-left">Viloyat</th>
                <th className="border px-2 py-1 text-left">Tuman</th>
                <th className="border px-2 py-1 text-left">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="border px-2 py-3 text-center text-gray-500" colSpan={5}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{m.name}</td>
                    <td className="border px-2 py-1">{m.district?.region?.name ?? "-"}</td>
                    <td className="border px-2 py-1">{m.district?.name ?? "-"}</td>
                    <td className="border px-2 py-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(m)}
                          className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(m)}
                          disabled={busyMahallaId === m.id}
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {busyMahallaId === m.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td className="border px-2 py-3 text-center text-gray-500" colSpan={5}>
                    Mos keluvchi mahalla topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4 space-y-3 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <h2 className="text-lg font-semibold">
            {editingMahallaId ? "Mahallani yangilash" : "Yangi mahalla qoshish"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block font-medium">Mahalla nomi</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium">Viloyat</label>
              <input
                type="text"
                value={form.regionName}
                onChange={(e) => setForm({ ...form, regionName: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium">Tuman</label>
              <input
                type="text"
                value={form.districtName}
                onChange={(e) => setForm({ ...form, districtName: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-[1px] disabled:opacity-70"
              >
                {isSaving ? "Saqlanmoqda..." : editingMahallaId ? "Yangilash" : "Saqlash"}
              </button>
              {editingMahallaId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { type BackendRole } from "@/lib/auth";
import {
  ApiError,
  createUser,
  deleteUser,
  enforceUzPhoneInput,
  listUsers,
  updateUser,
  type ApiUser
} from "@/lib/api";

const staffLikeRoles: BackendRole[] = ["STAFF", "RESIDENT"];

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState<{
    fullName: string;
    phone: string;
    role: BackendRole;
    mahallaId: string;
  }>({
    fullName: "",
    phone: "+998",
    role: "STAFF",
    mahallaId: ""
  });

  const resetForm = () => {
    setEditingUserId(null);
    setForm({
      fullName: "",
      phone: "+998",
      role: "STAFF",
      mahallaId: ""
    });
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listUsers({ page: 1, pageSize: 200 });
      setUsers(response.items);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Foydalanuvchilarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  const handleEdit = (user: ApiUser) => {
    setErrorMessage("");
    setSuccessMessage("");
    setEditingUserId(user.id);
    setForm({
      fullName: user.fullName,
      phone: enforceUzPhoneInput(user.phone),
      role: user.role,
      mahallaId: user.mahallaId ?? ""
    });
  };

  const handleDelete = async (user: ApiUser) => {
    const confirmed = window.confirm(`"${user.fullName}" foydalanuvchisini ochirishni tasdiqlaysizmi?`);
    if (!confirmed) {
      return;
    }

    setBusyUserId(user.id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteUser(user.id);
      setSuccessMessage("Foydalanuvchi ochirildi.");
      if (editingUserId === user.id) {
        resetForm();
      }
      await loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Foydalanuvchini ochirishda xatolik.");
      }
    } finally {
      setBusyUserId(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        role: form.role,
        mahallaId: staffLikeRoles.includes(form.role) ? form.mahallaId.trim() : undefined
      };

      if (!/^\+998\d{9}$/.test(payload.phone)) {
        setErrorMessage("Telefon raqam +998XXXXXXXXX formatida bolishi kerak.");
        return;
      }

      if (editingUserId) {
        await updateUser(editingUserId, payload);
        setSuccessMessage("Foydalanuvchi yangilandi.");
      } else {
        await createUser(payload);
        setSuccessMessage("Foydalanuvchi yaratildi.");
      }

      resetForm();
      await loadUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(editingUserId ? "Foydalanuvchini yangilashda xatolik." : "Foydalanuvchi yaratishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Foydalanuvchilar boshqaruvi</h1>
          <p className="text-sm text-gray-600">
            Super Admin foydalanuvchi royxatini koradi va CRUD amallarini bajaradi.
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish (FIO, telefon)..."
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
          <h2 className="text-lg font-semibold mb-3">Foydalanuvchilar jadvali</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">#</th>
                <th className="border px-2 py-1 text-left">FIO</th>
                <th className="border px-2 py-1 text-left">Roli</th>
                <th className="border px-2 py-1 text-left">Telefon</th>
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
                filtered.map((u, idx) => (
                  <tr key={u.id}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{u.fullName}</td>
                    <td className="border px-2 py-1">{u.role}</td>
                    <td className="border px-2 py-1">{u.phone}</td>
                    <td className="border px-2 py-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(u)}
                          className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(u)}
                          disabled={busyUserId === u.id}
                          className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {busyUserId === u.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td className="border px-2 py-3 text-center text-gray-500" colSpan={5}>
                    Mos keluvchi foydalanuvchi topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4 space-y-3 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <h2 className="text-lg font-semibold">
            {editingUserId ? "Foydalanuvchini yangilash" : "Yangi foydalanuvchi qoshish"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="block font-medium">FIO</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium">Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: enforceUzPhoneInput(e.target.value) })}
                inputMode="numeric"
                minLength={13}
                maxLength={13}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block font-medium">Roli</label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as BackendRole,
                    ...(staffLikeRoles.includes(e.target.value as BackendRole) ? {} : { mahallaId: "" })
                  })
                }
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-shadow transition-colors"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Hokimiyat</option>
                <option value="STAFF">Mahalla xodimi</option>
                <option value="RESIDENT">Aholi</option>
              </select>
            </div>
            {staffLikeRoles.includes(form.role) && (
              <div className="space-y-1">
                <label className="block font-medium">Mahalla ID</label>
                <input
                  type="text"
                  value={form.mahallaId}
                  onChange={(e) => setForm({ ...form, mahallaId: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 placeholder:text-slate-400 transition-shadow transition-colors"
                  required
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md hover:-translate-y-[1px] disabled:opacity-70"
              >
                {isSaving ? "Saqlanmoqda..." : editingUserId ? "Yangilash" : "Saqlash"}
              </button>
              {editingUserId && (
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

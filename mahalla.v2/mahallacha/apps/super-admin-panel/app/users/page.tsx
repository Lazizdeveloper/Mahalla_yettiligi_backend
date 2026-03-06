"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, ApiUser, clearSession, getSessionUser, listUsers, panelAllowsRole } from "@mmbp/shared";

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || !panelAllowsRole("super-admin", user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await listUsers({ page: 1, pageSize: 50 });
        setUsers(response.items);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          if (err.status === 401) {
            clearSession();
            router.replace("/login");
          }
        } else {
          setError("Foydalanuvchilarni yuklashda xatolik yuz berdi.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-gray-600">Users/RBAC ro'yxati backenddan olinmoqda.</p>
        </div>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="rounded-lg border bg-white p-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border px-2 py-1 text-left">FIO</th>
              <th className="border px-2 py-1 text-left">Telefon</th>
              <th className="border px-2 py-1 text-left">Roli</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td className="border px-2 py-1">{item.fullName}</td>
                <td className="border px-2 py-1">{item.phone}</td>
                <td className="border px-2 py-1">{item.role}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td className="border px-2 py-2 text-center text-gray-500" colSpan={3}>
                  Ma'lumot yo'q
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}

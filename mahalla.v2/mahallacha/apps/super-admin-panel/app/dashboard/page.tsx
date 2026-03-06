"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  ApiMahalla,
  ApiUser,
  clearSession,
  getDashboardSummary,
  getSessionUser,
  listMahallas,
  listUsers,
  panelAllowsRole
} from "@mmbp/shared";

type MahallaRow = ApiMahalla & { score: number };

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [mahallas, setMahallas] = useState<MahallaRow[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalMahallas, setTotalMahallas] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

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
        const [mahallaRes, userRes, summary] = await Promise.all([
          listMahallas({ page: 1, pageSize: 5 }),
          listUsers({ page: 1, pageSize: 5 }),
          getDashboardSummary()
        ]);

        setTotalMahallas(mahallaRes.total);
        setTotalUsers(userRes.total);
        setUsers(userRes.items);
        setAverageRating(summary.averageMonthlyRating);

        const mahallasWithScore = await Promise.all(
          mahallaRes.items.map(async (item) => {
            try {
              const mahallaSummary = await getDashboardSummary({ mahallaId: item.id });
              return { ...item, score: mahallaSummary.overallScore };
            } catch {
              return { ...item, score: 0 };
            }
          })
        );
        setMahallas(mahallasWithScore);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          if (err.status === 401) {
            clearSession();
            router.replace("/login");
          }
        } else {
          setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Super Admin Dashboard</h1>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Mahallalar soni</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "..." : totalMahallas}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Foydalanuvchilar soni</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "..." : totalUsers}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">O'rtacha mahalla reytingi</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "..." : averageRating.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Mahallalar</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">Nomi</th>
                <th className="border px-2 py-1 text-left">Hudud</th>
                <th className="border px-2 py-1 text-right">Reyting</th>
              </tr>
            </thead>
            <tbody>
              {mahallas.map((m) => (
                <tr key={m.id}>
                  <td className="border px-2 py-1">{m.name}</td>
                  <td className="border px-2 py-1">
                    {m.district?.region?.name ?? "-"}, {m.district?.name ?? "-"}
                  </td>
                  <td className="border px-2 py-1 text-right">{m.score.toFixed(2)}</td>
                </tr>
              ))}
              {!loading && mahallas.length === 0 ? (
                <tr>
                  <td className="border px-2 py-2 text-center text-gray-500" colSpan={3}>
                    Ma'lumot yo'q
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">So'nggi foydalanuvchilar</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="border px-2 py-1 text-left">FIO</th>
                <th className="border px-2 py-1 text-left">Roli</th>
                <th className="border px-2 py-1 text-left">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="border px-2 py-1">{u.fullName}</td>
                  <td className="border px-2 py-1">{u.role}</td>
                  <td className="border px-2 py-1">{u.phone}</td>
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
      </section>
    </main>
  );
}

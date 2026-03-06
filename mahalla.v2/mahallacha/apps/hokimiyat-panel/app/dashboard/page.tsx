"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  clearSession,
  getDashboardSummary,
  getSessionUser,
  listComplaints,
  listMahallas,
  panelAllowsRole
} from "@mmbp/shared";

type MahallaTableRow = {
  id: string;
  name: string;
  region: string;
  district: string;
  score: number;
  complaintsTotal: number;
  slaViolationRate: number;
};

export default function HokimiyatDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mahallaCount, setMahallaCount] = useState(0);
  const [complaintsTotal, setComplaintsTotal] = useState(0);
  const [slaCompliance, setSlaCompliance] = useState(0);
  const [rows, setRows] = useState<MahallaTableRow[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || !panelAllowsRole("hokimiyat", user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [mahallaRes, complaintRes, globalSummary] = await Promise.all([
          listMahallas({ page: 1, pageSize: 20 }),
          listComplaints({ page: 1, pageSize: 200 }),
          getDashboardSummary()
        ]);

        setMahallaCount(mahallaRes.total);
        setComplaintsTotal(complaintRes.total);
        setSlaCompliance(globalSummary.slaCompliance);

        const tableRows = await Promise.all(
          mahallaRes.items.map(async (item) => {
            try {
              const summary = await getDashboardSummary({ mahallaId: item.id });
              return {
                id: item.id,
                name: item.name,
                region: item.district?.region?.name ?? "-",
                district: item.district?.name ?? "-",
                score: summary.overallScore,
                complaintsTotal: summary.totalComplaints,
                slaViolationRate: Math.max(0, (100 - summary.slaCompliance) / 100)
              };
            } catch {
              return {
                id: item.id,
                name: item.name,
                region: item.district?.region?.name ?? "-",
                district: item.district?.name ?? "-",
                score: 0,
                complaintsTotal: 0,
                slaViolationRate: 0
              };
            }
          })
        );
        setRows(tableRows);
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
    <main className="p-6 space-y-6 bg-slate-50">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hokimiyat Dashboard</h1>
          <p className="text-sm text-gray-600">
            Hududlardagi mahalla faoliyati, shikoyatlar va SLA holati.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          Hududiy monitoring
        </div>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">Mahallalar soni</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "..." : mahallaCount}</p>
          <p className="mt-1 text-xs text-gray-500">Tizimga ulangan mahallalar</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">Jami shikoyatlar</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "..." : complaintsTotal}</p>
          <p className="mt-1 text-xs text-gray-500">Oxirgi davr bo'yicha kelib tushgan</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">O'rtacha SLA bajarilishi</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{loading ? "..." : `${slaCompliance.toFixed(1)}%`}</p>
          <p className="mt-1 text-xs text-gray-500">Muddatida yopilgan shikoyatlar ulushi</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Mahallalar reytingi</h2>
            <p className="text-xs text-gray-500">
              Har bir mahalla uchun reyting, shikoyatlar soni va SLA buzilish foizi.
            </p>
          </div>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="border px-2 py-1 text-left">Mahalla</th>
              <th className="border px-2 py-1 text-left">Hudud</th>
              <th className="border px-2 py-1 text-right">Reyting (Score)</th>
              <th className="border px-2 py-1 text-right">Shikoyatlar</th>
              <th className="border px-2 py-1 text-right">SLA buzilishi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="border px-2 py-1">{m.name}</td>
                <td className="border px-2 py-1">
                  {m.region}, {m.district}
                </td>
                <td className="border px-2 py-1 text-right">{m.score.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{m.complaintsTotal}</td>
                <td className="border px-2 py-1 text-right">{(m.slaViolationRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
            {!loading && rows.length === 0 ? (
              <tr>
                <td className="border px-2 py-2 text-center text-gray-500" colSpan={5}>
                  Ma'lumot yo'q
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}

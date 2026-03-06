"use client";

import { useEffect, useState } from "react";
import { ApiError, getDashboardSummary, listComplaints, listMahallas } from "@/lib/api";

interface MahallaRow {
  id: string;
  name: string;
  region: string;
  district: string;
  score: number;
  complaintsOpen: number;
}

export default function HokimiyatMahallasPage() {
  const [rows, setRows] = useState<MahallaRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [mahallaRes, complaintsRes, summaryRes] = await Promise.all([
          listMahallas({ page: 1, pageSize: 100 }),
          listComplaints({ page: 1, pageSize: 300 }),
          getDashboardSummary()
        ]);

        const openCountByMahalla = complaintsRes.items.reduce<Record<string, number>>((acc, item) => {
          if (item.status === "NEW" || item.status === "IN_PROGRESS") {
            acc[item.mahallaId] = (acc[item.mahallaId] ?? 0) + 1;
          }
          return acc;
        }, {});

        const mapped = await Promise.all(
          mahallaRes.items.map(async (m) => {
            try {
              const one = await getDashboardSummary({ mahallaId: m.id });
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: one.averageMonthlyRating ?? 0,
                complaintsOpen: openCountByMahalla[m.id] ?? 0
              };
            } catch {
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: summaryRes.averageMonthlyRating ?? 0,
                complaintsOpen: openCountByMahalla[m.id] ?? 0
              };
            }
          })
        );

        setRows(mapped);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Mahalla ma'lumotlarini yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const avgScore = rows.reduce((sum, m) => sum + m.score, 0) / (rows.length || 1);
  const totalMahallas = rows.length;
  const totalComplaints = rows.reduce((sum, m) => sum + m.complaintsOpen, 0);

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mahallalar reytingi</h1>
          <p className="text-sm text-slate-300">Hudud bo'yicha mahallalar reytingi, ochiq shikoyatlar soni va umumiy ko'rsatkichlar.</p>
        </div>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Mahallalar soni</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-sky-300">{totalMahallas}</p>
          <p className="mt-1 text-[11px] text-slate-400">Reyting kuzatuvi yoqilgan mahallalar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">O'rtacha reyting</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">{avgScore.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Mahallalar bo'yicha umumiy ball</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Ochiq shikoyatlar</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-300">{totalComplaints}</p>
          <p className="mt-1 text-[11px] text-slate-400">Mahallalar kesimidagi jami ochiq shikoyatlar</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm space-y-3 overflow-hidden">
        <div className="px-4 pt-3">
          <h2 className="text-sm font-semibold">Top mahallalar</h2>
          <p className="text-[11px] text-slate-400">Reyting va ochiq shikoyatlar soniga qarab saralangan mahallalar ro'yxati.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                <th className="px-3 py-2 text-left font-medium">Mahalla</th>
                <th className="px-3 py-2 text-left font-medium">Hudud</th>
                <th className="px-3 py-2 text-right font-medium">Reyting</th>
                <th className="px-3 py-2 text-right font-medium">Ochiq shikoyatlar</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-3 py-3 text-center text-slate-400" colSpan={4}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!isLoading &&
                rows.map((m) => (
                  <tr key={m.id} className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors">
                    <td className="px-3 py-2 align-middle text-xs text-slate-50">{m.name}</td>
                    <td className="px-3 py-2 align-middle text-xs text-slate-300">{m.region}, {m.district}</td>
                    <td className="px-3 py-2 align-middle text-right text-xs text-emerald-300">{m.score.toFixed(2)}</td>
                    <td className="px-3 py-2 align-middle text-right text-xs text-rose-300">{m.complaintsOpen}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

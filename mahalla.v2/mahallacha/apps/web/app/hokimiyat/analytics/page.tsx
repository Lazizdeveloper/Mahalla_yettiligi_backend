"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, getDashboardCharts, getDashboardSummary } from "@/lib/api";

export default function HokimiyatAnalyticsPage() {
  const [summary, setSummary] = useState<{
    totalComplaints: number;
    slaCompliance: number;
    averageMonthlyRating: number;
  } | null>(null);
  const [charts, setCharts] = useState<{
    complaintsByCategory: Array<{ category: string; value: number }>;
    ratingLine: Array<{ month: string; value: number }>;
  }>({
    complaintsByCategory: [],
    ratingLine: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          getDashboardSummary(),
          getDashboardCharts({ months: 6 })
        ]);
        setSummary({
          totalComplaints: summaryRes.totalComplaints,
          slaCompliance: summaryRes.slaCompliance,
          averageMonthlyRating: summaryRes.averageMonthlyRating
        });
        setCharts({
          complaintsByCategory: chartsRes.complaintsByCategory,
          ratingLine: chartsRes.ratingLine
        });
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Analitika ma'lumotlarini yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const complaintsTrend = useMemo(
    () => charts.complaintsByCategory.map((x) => x.value).slice(0, 6),
    [charts.complaintsByCategory]
  );
  const slaTrend = useMemo(
    () => charts.ratingLine.map((x) => Math.min(1, Math.max(0, x.value / 5))),
    [charts.ratingLine]
  );

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Analitika paneli</h1>
        <p className="text-sm text-slate-300">Mahalla reytingi, shikoyatlar soni, SLA buzilishlari va ish intizomi bo'yicha umumiy ko'rsatkichlar.</p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">So'nggi davrda eskalatsiya</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-300">
            {isLoading ? "..." : summary ? `${summary.totalComplaints}` : "0"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Eskalatsiya qilingan shikoyatlar soni</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">SLA bajarilishi trendi</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">
            {isLoading ? "..." : `${Math.round(summary?.slaCompliance ?? 0)}%`}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">O'tgan davrga nisbatan holat</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">O'rtacha reyting</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-sky-300">
            {isLoading ? "..." : (summary?.averageMonthlyRating ?? 0).toFixed(2)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Mahallalar bo'yicha umumiy baho</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Eskalatsiya trendlari</h2>
          <p className="text-[11px] text-slate-400">Kategoriya kesimida shikoyatlar soni.</p>
          <div className="mt-2 grid grid-cols-6 gap-2 items-end h-28">
            {(complaintsTrend.length ? complaintsTrend : [0, 0, 0, 0, 0, 0]).map((value, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-rose-500 via-indigo-500 to-sky-400 transition-all"
                  style={{ height: `${Math.min(100, value * 8)}%` }}
                />
                <span className="text-[10px] text-slate-400">M{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">SLA bajarilishi</h2>
          <p className="text-[11px] text-slate-400">So'nggi 6 davr bo'yicha soddalashtirilgan chiziq.</p>
          <div className="mt-4 space-y-2">
            {(slaTrend.length ? slaTrend : [0, 0, 0, 0, 0, 0]).map((v, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-slate-400">M{idx + 1}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${v * 100}%` }} />
                </div>
                <span className="w-10 text-right text-slate-200">{Math.round(v * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

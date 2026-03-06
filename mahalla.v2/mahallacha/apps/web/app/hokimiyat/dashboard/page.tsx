"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiError, getDashboardCharts, getDashboardSummary, listComplaints, listMahallas } from "@/lib/api";

interface MahallaStat {
  id: string;
  name: string;
  region: string;
  district: string;
  score: number;
  complaintsTotal: number;
  slaViolationRate: number;
}

export default function HokimiyatDashboardPage() {
  const [mahallaStats, setMahallaStats] = useState<MahallaStat[]>([]);
  const [summary, setSummary] = useState<{
    totalComplaints: number;
    averageMonthlyRating: number;
    slaCompliance: number;
    averageResponseHours: number;
  } | null>(null);
  const [complaintsByCategory, setComplaintsByCategory] = useState<Array<{ category: string; value: number }>>([]);
  const [ratingLine, setRatingLine] = useState<Array<{ month: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [mahallasRes, summaryRes, chartsRes, complaintsRes] = await Promise.all([
          listMahallas({ page: 1, pageSize: 50 }),
          getDashboardSummary(),
          getDashboardCharts({ months: 6 }),
          listComplaints({ page: 1, pageSize: 300 })
        ]);

        const byMahallaComplaintCount = complaintsRes.items.reduce<Record<string, number>>((acc, item) => {
          acc[item.mahallaId] = (acc[item.mahallaId] ?? 0) + 1;
          return acc;
        }, {});

        const stats = await Promise.all(
          mahallasRes.items.map(async (m) => {
            try {
              const one = await getDashboardSummary({ mahallaId: m.id });
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: one.averageMonthlyRating ?? 0,
                complaintsTotal: byMahallaComplaintCount[m.id] ?? 0,
                slaViolationRate: 1 - (one.slaCompliance ?? 100) / 100
              };
            } catch {
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: summaryRes.averageMonthlyRating ?? 0,
                complaintsTotal: byMahallaComplaintCount[m.id] ?? 0,
                slaViolationRate: 0
              };
            }
          })
        );

        setSummary({
          totalComplaints: summaryRes.totalComplaints,
          averageMonthlyRating: summaryRes.averageMonthlyRating,
          slaCompliance: summaryRes.slaCompliance,
          averageResponseHours: summaryRes.averageResponseHours
        });
        setMahallaStats(stats);
        setComplaintsByCategory(chartsRes.complaintsByCategory);
        setRatingLine(chartsRes.ratingLine);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Dashboard ma'lumotlarini yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const totalMahallas = mahallaStats.length;
  const totalComplaints = summary?.totalComplaints ?? 0;
  const avgScore = summary?.averageMonthlyRating ?? 0;
  const avgSlaViolation =
    mahallaStats.length > 0
      ? mahallaStats.reduce((sum, m) => sum + m.slaViolationRate, 0) / mahallaStats.length
      : 0;

  const maxCategoryCount = useMemo(
    () => Math.max(1, ...complaintsByCategory.map((c) => c.value)),
    [complaintsByCategory]
  );

  const linePoints = ratingLine
    .map((p, idx) => {
      const x = ratingLine.length === 1 ? 0 : (idx / (ratingLine.length - 1)) * 280;
      const y = 110 - (p.value / 5) * 70;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <section className="rounded-2xl bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-800 px-5 py-4 shadow-xl text-slate-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100/90">
            Hokimiyat - Government Monitoring
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            MMBP Government Monitoring Dashboard
          </h1>
          <p className="text-xs md:text-sm text-sky-100/90 max-w-xl">
            Mahallalar faoliyati, eskalatsiya qilingan shikoyatlar va SLA holati bo'yicha tezkor tahliliy ko'rsatkichlar.
          </p>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Umumiy reyting</p>
          <p className="text-2xl font-semibold tracking-tight text-sky-300">{avgScore.toFixed(2)}</p>
          <p className="text-[11px] text-slate-400">Mahallalar bo'yicha o'rtacha ball</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">SLA bajarilishi</p>
          <p className="text-2xl font-semibold tracking-tight text-emerald-300">{Math.round((1 - avgSlaViolation) * 100)}%</p>
          <p className="text-[11px] text-slate-400">Muddatida yopilgan shikoyatlar ulushi</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Jami shikoyatlar</p>
          <p className="text-2xl font-semibold tracking-tight text-rose-300">{totalComplaints}</p>
          <p className="text-[11px] text-slate-400">Hudud bo'yicha umumiy eskalatsiya</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">O'rtacha javob vaqti</p>
          <p className="text-2xl font-semibold tracking-tight text-indigo-300">{(summary?.averageResponseHours ?? 0).toFixed(1)} soat</p>
          <p className="text-[11px] text-slate-400">Realdan olingan ko'rsatkich</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Oylik reyting trendi</h2>
            <p className="text-[11px] text-slate-400">Mahalla reytinglarining vaqt bo'yicha o'zgarishi.</p>
          </div>
          <div className="mt-2">
            <svg viewBox="0 0 300 120" className="w-full h-40 text-sky-400">
              <defs>
                <linearGradient id="ratingGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 110 H300" stroke="#1f2937" strokeWidth="1" />
              <polyline points={linePoints} fill="none" stroke="url(#ratingGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {ratingLine.map((p, idx) => {
                const x = ratingLine.length === 1 ? 0 : (idx / (ratingLine.length - 1)) * 280;
                const y = 110 - (p.value / 5) * 70;
                return <circle key={`${p.month}-${idx}`} cx={x} cy={y} r={3} fill="#38bdf8" />;
              })}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-slate-400">
              {ratingLine.map((p) => (
                <span key={p.month} className="flex-1 text-center">
                  {p.month}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">Shikoyatlar kategoriyalari</h2>
          <p className="text-[11px] text-slate-400">Qaysi yo'nalishlarda eng ko'p murojaatlar kelib tushayotganini ko'rsatadi.</p>
          <div className="mt-3 flex items-end gap-2 h-40">
            {complaintsByCategory.map((c) => (
              <div key={c.category} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-rose-500 via-indigo-500 to-sky-400 transition-all"
                  style={{ height: `${(c.value / maxCategoryCount) * 100}%` }}
                />
                <span className="text-[10px] text-center text-slate-300">{c.category}</span>
                <span className="text-[10px] text-slate-500">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-semibold">Mahallalar reytingi</h2>
            <p className="text-[11px] text-slate-400">Reyting, eskalatsiya soni va SLA buzilish holati bo'yicha saralangan ro'yxat.</p>
          </div>
          <div className="hidden md:block text-[11px] text-slate-400">Jami mahallalar: {totalMahallas}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Mahalla</th>
                <th className="px-3 py-2 text-left font-medium">Hudud</th>
                <th className="px-3 py-2 text-right font-medium">Reyting</th>
                <th className="px-3 py-2 text-right font-medium">Shikoyatlar</th>
                <th className="px-3 py-2 text-right font-medium">SLA buzilishi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-3 py-3 text-center text-slate-400" colSpan={6}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!isLoading &&
                mahallaStats.map((m, index) => {
                  const violationPct = m.slaViolationRate * 100;
                  const badgeColor =
                    violationPct < 10
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                      : violationPct < 20
                      ? "bg-amber-500/10 text-amber-200 border-amber-400/30"
                      : "bg-rose-500/10 text-rose-200 border-rose-400/30";

                  return (
                    <tr key={m.id} className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors">
                      <td className="px-3 py-2 align-middle text-[11px] text-slate-300">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium">{index + 1}</span>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs font-medium">{m.name}</td>
                      <td className="px-3 py-2 align-middle text-xs text-slate-300">{m.region}, {m.district}</td>
                      <td className="px-3 py-2 align-middle text-xs text-right">
                        <span className="inline-flex items-center justify-end gap-1">
                          <span className="font-semibold">{m.score.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">/ 5.00</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-right text-rose-200">{m.complaintsTotal}</td>
                      <td className="px-3 py-2 align-middle text-xs text-right">
                        <span className={`inline-flex items-center justify-end rounded-full border px-2 py-0.5 text-[11px] ${badgeColor}`}>
                          {violationPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

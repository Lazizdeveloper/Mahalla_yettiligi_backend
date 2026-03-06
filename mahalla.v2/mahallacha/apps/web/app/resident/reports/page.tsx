"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, createRating, listMonthlyReports, type ApiMonthlyReport } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

const pickVerdict = (score: number): "TRUTH" | "SUSPICIOUS" | "FALSE" => {
  if (score >= 4) {
    return "TRUTH";
  }
  if (score >= 3) {
    return "SUSPICIOUS";
  }
  return "FALSE";
};

export default function ResidentReportsPage() {
  const [reports, setReports] = useState<ApiMonthlyReport[]>([]);
  const [reportId, setReportId] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const sessionUser = getSessionUser();

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listMonthlyReports({ page: 1, pageSize: 50 });
      setReports(response.items);
      if (!reportId && response.items[0]) {
        setReportId(response.items[0].id);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Hisobotlarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, []);

  const totalRatings = useMemo(() => {
    if (!sessionUser) {
      return 0;
    }
    return reports.reduce((sum, report) => sum + (report.ratings?.filter((r) => r.userId === sessionUser.id).length ?? 0), 0);
  }, [reports, sessionUser]);

  const avgScore = useMemo(() => {
    if (!sessionUser) {
      return 0;
    }
    const all = reports.flatMap((report) => report.ratings?.filter((r) => r.userId === sessionUser.id) ?? []);
    if (all.length === 0) {
      return 0;
    }
    return all.reduce((sum, r) => sum + r.score, 0) / all.length;
  }, [reports, sessionUser]);

  const ratingByReport = useMemo(
    () =>
      reports.map((r) => {
        const rs = r.ratings ?? [];
        const avg = rs.reduce((sum, it) => sum + it.score, 0) / (rs.length || 1);
        return { report: r, avg, count: rs.length };
      }),
    [reports]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await createRating({
        reportId,
        score,
        verdict: pickVerdict(score),
        comment
      });
      setScore(5);
      setComment("");
      await loadReports();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Baho yuborishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full max-w-full p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 pb-24 sm:pb-6 box-border text-white">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Oylik baholash</h1>
        <p className="text-xs sm:text-sm text-slate-300 font-normal">
          Mahalla oylik hisobotlarini ko'rib chiqib, 1 dan 5 gacha baho va izoh qoldiring.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="resident-card resident-card-hover p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Jami hisobotlar</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums">{reports.length}</p>
          <p className="mt-1 text-xs text-slate-400">Baholash uchun mavjud oylar</p>
        </div>
        <div className="resident-card resident-card-hover p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mening baholarim</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-white tabular-nums">{totalRatings}</p>
          <p className="mt-1 text-xs text-slate-400">Yuborgan reytinglar soni</p>
        </div>
        <div className="resident-card resident-card-hover p-4 sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">O'rtacha baho</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-400 tabular-nums">{avgScore.toFixed(1)}</p>
          <p className="mt-1 text-xs text-slate-400">Siz bergan baholar bo'yicha o'rtacha</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <section className="resident-card overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Hisobotlar ro'yxati</h2>
            <p className="text-xs text-slate-400 mt-0.5">Har bir oy bo'yicha qisqacha xulosa va o'rtacha baho</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm border-collapse">
              <thead>
                <tr className="bg-white/5 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="border border-white/10 px-3 py-2 text-left font-medium">Oy</th>
                  <th className="border border-white/10 px-3 py-2 text-left font-medium">Hisobot</th>
                  <th className="border border-white/10 px-3 py-2 text-left font-medium">Qisqacha</th>
                  <th className="border border-white/10 px-3 py-2 text-right font-medium">O'rtacha baho</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="border border-white/10 px-3 py-3 text-center text-slate-400" colSpan={4}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  ratingByReport.map(({ report, avg, count }) => (
                    <tr key={report.id} className="border-t border-white/10 odd:bg-white/5 even:bg-transparent hover:bg-white/10 transition-colors">
                      <td className="border border-white/10 px-3 py-2 text-xs font-medium text-white">
                        {new Date(report.month).toISOString().slice(0, 7)}
                      </td>
                      <td className="border border-white/10 px-3 py-2 text-xs font-medium text-white">Oylik hisobot</td>
                      <td className="border border-white/10 px-3 py-2 text-xs text-slate-400 line-clamp-2 max-w-md">{report.summary}</td>
                      <td className="border border-white/10 px-3 py-2 text-xs text-right text-amber-400">
                        {count === 0 ? "-" : `${avg.toFixed(1)} (${count})`}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="resident-card resident-form p-4 space-y-4">
          <h2 className="text-sm font-semibold text-white">Hisobotni baholash</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Hisobot oyi</label>
            <select
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.month).toISOString().slice(0, 7)} - Oylik hisobot
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Baho (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={score}
              onChange={(e) => setScore(Number(e.target.value) || 1)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Izoh (ixtiyoriy)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 h-20"
              placeholder="Hisobot bo'yicha fikringiz..."
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:shadow-lg hover:shadow-violet-500/40"
          >
            {isSaving ? "Yuborilmoqda..." : "Bahoni yuborish"}
          </button>
        </form>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, createMonthlyReport, listMonthlyReports, type ApiMonthlyReport } from "@/lib/api";
import { IconFileText, IconCheckCircle, IconPlus } from "../icons";

export default function MahallaReportsPage() {
  const [reports, setReports] = useState<ApiMonthlyReport[]>([]);
  const [month, setMonth] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReports = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listMonthlyReports({ page: 1, pageSize: 100 });
      setReports(response.items);
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

  const submitted = useMemo(() => reports.filter((r) => r.status === "SUBMITTED").length, [reports]);
  const drafts = useMemo(() => reports.filter((r) => r.status === "DRAFT").length, [reports]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createMonthlyReport({
        month,
        summary,
        status: status === "submitted" ? "SUBMITTED" : "DRAFT",
        items: [
          {
            workName: "Hisobot bandi",
            workDate: new Date().toISOString(),
            resultText: summary
          }
        ]
      });
      setMonth("");
      setSummary("");
      setStatus("draft");
      await loadReports();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Hisobot yaratishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <IconFileText className="w-6 h-6 text-sky-400 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">Oylik hisobotlar</h1>
        </div>
        <p className="text-sm text-slate-300 font-normal">
          Har oy yakunida qilingan ishlar va umumiy xulosalar.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconFileText className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Jami hisobotlar</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-sky-300 tabular-nums">{reports.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Yaratilgan hisobotlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Yuborilgan</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-300 tabular-nums">{submitted}</p>
          <p className="mt-1 text-[11px] text-slate-400">Tasdiqlangan hisobotlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconFileText className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Qoralama</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-300 tabular-nums">{drafts}</p>
          <p className="mt-1 text-[11px] text-slate-400">Tayyorlanayotgan hisobotlar</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-50 tracking-tight flex items-center gap-2">
            <IconPlus className="w-4 h-4 text-sky-400" />
            Yangi oylik hisobot
          </h2>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Oy (YYYY-MM)</label>
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="2026-03"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Qisqacha xulosa</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 h-24"
              placeholder="Oy yakunida amalga oshirilgan asosiy ishlar..."
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "submitted")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="draft">Qoralama</option>
              <option value="submitted">Yuborilgan</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            {isSaving ? "Saqlanmoqda..." : "Hisobotni saqlash"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <IconFileText className="w-4 h-4 text-sky-400 shrink-0" />
              <h2 className="text-sm font-semibold tracking-tight">Hisobotlar ro'yxati</h2>
            </div>
            <p className="text-[11px] text-slate-400">Oylik hisobotlar va ularning holati.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Oy</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Qisqacha</th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="border border-slate-800 px-3 py-3 text-center text-slate-400" colSpan={3}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  reports.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="border border-slate-800 px-3 py-2 text-xs font-medium text-slate-50">
                        {new Date(r.month).toISOString().slice(0, 7)}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300 line-clamp-2 max-w-md">
                        {r.summary}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 text-center">
                        {r.status === "SUBMITTED" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            Yuborilgan
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Qoralama
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && reports.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">Hisobot topilmadi.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

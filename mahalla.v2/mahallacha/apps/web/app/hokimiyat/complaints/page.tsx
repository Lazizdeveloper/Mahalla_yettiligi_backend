"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, listComplaints, type ApiComplaint } from "@/lib/api";

type ComplaintStatus = "NEW" | "IN_PROGRESS" | "ANSWERED";

export default function HokimiyatComplaintsPage() {
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await listComplaints({ page: 1, pageSize: 300 });
        setComplaints(response.items);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Shikoyatlarni yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;
        const q = query.toLowerCase();
        const matchesQuery =
          !q ||
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.mahallaId.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      }),
    [complaints, statusFilter, query]
  );

  const total = complaints.length;
  const overdue = complaints.filter((c) => c.status !== "ANSWERED" && new Date(c.deadlineAt).getTime() < Date.now()).length;

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eskalatsiya qilingan shikoyatlar</h1>
          <p className="text-sm text-slate-300">
            SLA buzilgan va hokimiyat nazoratiga o'tgan shikoyatlar ro'yxati.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 text-xs text-slate-300">
          <span>Jami eskalatsiya: <span className="font-semibold text-slate-50">{total}</span></span>
          <span>Hozircha kechikkanlar: <span className="font-semibold text-rose-400">{overdue}</span></span>
        </div>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-full border px-3 py-1 ${
                statusFilter === "all"
                  ? "border-sky-500 bg-sky-600 text-slate-50"
                  : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
              } text-xs font-medium transition`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("NEW")}
              className={`rounded-full border px-3 py-1 ${
                statusFilter === "NEW"
                  ? "border-rose-500 bg-rose-600 text-white"
                  : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
              } text-xs font-medium transition`}
            >
              Yangi
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`rounded-full border px-3 py-1 ${
                statusFilter === "IN_PROGRESS"
                  ? "border-amber-400 bg-amber-500 text-slate-950"
                  : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
              } text-xs font-medium transition`}
            >
              Jarayonda
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ANSWERED")}
              className={`rounded-full border px-3 py-1 ${
                statusFilter === "ANSWERED"
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
              } text-xs font-medium transition`}
            >
              Yopilgan
            </button>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, mahalla yoki tuman bo'yicha qidirish..."
              className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-50 shadow-sm hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 placeholder:text-slate-500 transition-shadow transition-colors"
            />
          </div>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="border border-slate-800 px-2 py-1 text-left text-[11px] text-slate-300">ID</th>
                <th className="border border-slate-800 px-2 py-1 text-left text-[11px] text-slate-300">Mahalla ID</th>
                <th className="border border-slate-800 px-2 py-1 text-left text-[11px] text-slate-300">Kategoriya</th>
                <th className="border border-slate-800 px-2 py-1 text-left text-[11px] text-slate-300">Yaratilgan</th>
                <th className="border border-slate-800 px-2 py-1 text-right text-[11px] text-slate-300">Kechikish (soat)</th>
                <th className="border border-slate-800 px-2 py-1 text-center text-[11px] text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="border border-slate-800 px-2 py-3 text-center text-slate-400" colSpan={6}>
                    Yuklanmoqda...
                  </td>
                </tr>
              )}
              {!isLoading &&
                filtered.map((c) => {
                  const overdueHours = Math.max(0, Math.floor((Date.now() - new Date(c.deadlineAt).getTime()) / (1000 * 60 * 60)));
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/70 transition-colors odd:bg-slate-900/40 even:bg-slate-900/20">
                      <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-100">{c.id.slice(0, 8)}</td>
                      <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-200">{c.mahallaId.slice(0, 8)}</td>
                      <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-200">{c.category}</td>
                      <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-300">{new Date(c.createdAt).toLocaleString()}</td>
                      <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-right">
                        <span className={`inline-flex items-center justify-end gap-1 ${overdueHours > 0 ? "text-rose-300" : "text-slate-200"}`}>
                          {overdueHours}
                        </span>
                      </td>
                      <td className="border border-slate-800 px-2 py-1 align-middle text-center text-xs">
                        {c.status === "NEW" && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                            Yangi
                          </span>
                        )}
                        {c.status === "IN_PROGRESS" && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Jarayonda
                          </span>
                        )}
                        {c.status === "ANSWERED" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            Yopilgan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">Tanlangan filtrlar bo'yicha shikoyatlar topilmadi.</div>
          )}
        </div>
      </section>
    </main>
  );
}

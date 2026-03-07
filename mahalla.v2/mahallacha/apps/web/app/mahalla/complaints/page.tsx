"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  listComplaints,
  respondComplaint,
  updateComplaintStatus,
  type ApiComplaint
} from "@/lib/api";
import { IconMessageCircle, IconImage, IconCheckCircle, IconSend } from "../icons";

type ComplaintStatus = "NEW" | "IN_PROGRESS" | "ANSWERED" | "REJECTED";

export default function MahallaComplaintsPage() {
  const [items, setItems] = useState<ApiComplaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadComplaints = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listComplaints({ page: 1, pageSize: 100 });
      setItems(response.items);
      if (!selectedId && response.items[0]) {
        setSelectedId(response.items[0].id);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Murojaatlarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((m) => {
        const matchStatus = statusFilter === "all" || m.status === statusFilter;
        const q = query.toLowerCase();
        const matchQuery =
          !q ||
          m.id.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q);
        return matchStatus && matchQuery;
      }),
    [items, statusFilter, query]
  );

  const selected = items.find((m) => m.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selected) {
      setResponseText("");
      return;
    }
    setResponseText(selected.responseText ?? "");
  }, [selected?.id]);

  const setStatus = async (targetStatus: ComplaintStatus) => {
    if (!selected || selected.status === targetStatus) {
      return;
    }

    setIsUpdating(true);
    setErrorMessage("");
    try {
      await updateComplaintStatus(selected.id, targetStatus);
      await loadComplaints();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Statusni yangilashda xatolik.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRespond = async () => {
    if (!selected || selected.status === "ANSWERED") {
      return;
    }

    const text = responseText.trim();
    if (text.length < 2) {
      setErrorMessage("Javob matni kamida 2 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setIsResponding(true);
    setErrorMessage("");
    try {
      await respondComplaint(selected.id, text);
      await loadComplaints();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Javob yuborishda xatolik.");
      }
    } finally {
      setIsResponding(false);
    }
  };

  const total = items.length;
  const newCount = items.filter((m) => m.status === "NEW").length;

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconMessageCircle className="w-6 h-6 text-sky-400 shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight">Murojaatlar boshqaruvi</h1>
          </div>
          <p className="text-sm text-slate-300 font-normal mt-1">
            Fuqarolardan kelgan shikoyatlar va murojaatlar. Statusni o'zgartirish va javob yozish.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 text-xs text-slate-300">
          <span>Jami: <span className="font-semibold text-slate-50">{total}</span></span>
          <span>Yangi: <span className="font-semibold text-rose-400">{newCount}</span></span>
        </div>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {(["all", "NEW", "IN_PROGRESS", "ANSWERED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    statusFilter === s
                      ? "border-sky-500 bg-sky-600 text-white"
                      : "border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {s === "all" ? "Barchasi" : s === "NEW" ? "Yangi" : s === "IN_PROGRESS" ? "Jarayonda" : "Yopilgan"}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, kategoriya yoki matn bo'yicha qidirish..."
              className="w-full md:w-64 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">ID</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Kategoriya</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Tavsif</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Sana</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Muddat</th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="border border-slate-800 px-3 py-3 text-center text-slate-400" colSpan={6}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  filtered.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`border-t border-slate-800/80 cursor-pointer odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors ${
                        m.id === selected?.id ? "ring-1 ring-sky-500/60" : ""
                      }`}
                    >
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-100">{m.id.slice(0, 8)}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-200">{m.category}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300 line-clamp-2 max-w-[200px]">{m.description}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">{new Date(m.createdAt).toLocaleDateString()}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">{new Date(m.deadlineAt).toLocaleDateString()}</td>
                      <td className="border border-slate-800 px-3 py-2 text-center">
                        {m.status === "NEW" && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                            Yangi
                          </span>
                        )}
                        {m.status === "IN_PROGRESS" && (
                          <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Jarayonda
                          </span>
                        )}
                        {m.status === "ANSWERED" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            Yopilgan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Tanlangan filtrlar bo'yicha murojaatlar topilmadi.
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm space-y-3">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Murojaat ID: <span className="text-slate-100">{selected.id.slice(0, 8)}</span>
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-slate-50">{selected.category}</h2>
                </div>
                {selected.status === "NEW" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void setStatus("IN_PROGRESS")}
                    className="rounded-full px-3 py-1 text-[11px] font-medium bg-amber-500 text-slate-950 hover:bg-amber-400 transition inline-flex items-center gap-1.5"
                  >
                    <IconSend className="w-3 h-3" />
                    Jarayonga oldim
                  </button>
                )}
                {selected.status === "IN_PROGRESS" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void handleRespond()}
                    className="rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition inline-flex items-center gap-1.5"
                  >
                    <IconCheckCircle className="w-3 h-3" />
                    Javob berib yopish
                  </button>
                )}
                {selected.status === "ANSWERED" && (
                  <span className="rounded-full px-3 py-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-200 border border-emerald-400/30">
                    Hal qilingan
                  </span>
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <p>
                  <span className="text-slate-400">Yaratilgan:</span> <span>{new Date(selected.createdAt).toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-slate-400">Muddat:</span> <span>{new Date(selected.deadlineAt).toLocaleString()}</span>
                </p>
              </div>

              <div className="text-xs text-slate-200 border border-slate-800 rounded-lg px-3 py-2 bg-slate-900/70">
                {selected.description}
              </div>

              {selected.status !== "ANSWERED" ? (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-slate-300" htmlFor="complaint-response-text">
                    Fuqaroga javob
                  </label>
                  <textarea
                    id="complaint-response-text"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Murojaat bo'yicha ko'rilgan choralarni yozing..."
                    className="w-full min-h-24 rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    disabled={isResponding || isUpdating}
                    onClick={() => void handleRespond()}
                    className="w-full rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {isResponding ? "Yuborilmoqda..." : "Javob yuborish"}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-300">Yuborilgan javob</p>
                  <p className="text-xs text-emerald-300 border border-emerald-500/20 rounded-lg px-3 py-2 bg-emerald-500/5">
                    {selected.responseText ?? "Javob matni mavjud emas."}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <IconImage className="w-3.5 h-3.5 text-slate-400" />
                  Yuklangan rasmlar
                </p>
                <p className="text-[11px] text-slate-500">Media endpoint ulanmagani uchun bu qismda rasm ko'rsatilmaydi.</p>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">Murojaat detallarini ko'rish uchun jadvaldan bir qatorni tanlang.</p>
          )}
        </aside>
      </section>
    </main>
  );
}

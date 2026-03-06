"use client";

import React, { useEffect, useState } from "react";
import { ApiError, listComplaints, listMonthlyReports, listPosts, type ApiComplaint, type ApiMonthlyReport, type ApiPost } from "@/lib/api";
import {
  IconMegaphone,
  IconMessageCircle,
  IconFileText,
  IconAlertCircle
} from "../icons";

export default function MahallaDashboardPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [reports, setReports] = useState<ApiMonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [postRes, complaintRes, reportRes] = await Promise.all([
          listPosts({ page: 1, pageSize: 20 }),
          listComplaints({ page: 1, pageSize: 20 }),
          listMonthlyReports({ page: 1, pageSize: 12 })
        ]);
        setPosts(postRes.items);
        setComplaints(complaintRes.items);
        setReports(reportRes.items);
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

  const activePosts = posts.length;
  const newComplaints = complaints.filter((c) => c.status === "NEW").length;
  const reportsCount = reports.length;

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <section className="rounded-2xl bg-gradient-to-r from-sky-700 via-indigo-700 to-blue-800 px-5 py-4 shadow-xl text-slate-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100/90 font-medium">
            Mahalla - Boshqaruv paneli
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans">
            Mahalla Dashboard
          </h1>
          <p className="text-xs md:text-sm text-sky-100/90 max-w-xl font-normal">
            E'lonlar, murojaatlar va oylik hisobotlar bo'yicha tezkor ko'rsatkichlar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <div className="rounded-xl bg-slate-950/15 border border-white/20 px-3 py-2 min-w-[100px] flex items-start gap-2">
            <IconMegaphone className="w-4 h-4 text-sky-200 mt-0.5 shrink-0" />
            <div>
              <p className="text-sky-100/90 font-medium">E'lonlar</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{activePosts}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/15 border border-white/20 px-3 py-2 min-w-[100px] flex items-start gap-2">
            <IconMessageCircle className="w-4 h-4 text-sky-200 mt-0.5 shrink-0" />
            <div>
              <p className="text-sky-100/90 font-medium">Yangi murojaatlar</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{newComplaints}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/15 border border-white/20 px-3 py-2 min-w-[100px] flex items-start gap-2">
            <IconFileText className="w-4 h-4 text-sky-200 mt-0.5 shrink-0" />
            <div>
              <p className="text-sky-100/90 font-medium">Hisobotlar</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{reportsCount}</p>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconMegaphone className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Faol e'lonlar</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-sky-300 tabular-nums">{activePosts}</p>
          <p className="text-[11px] text-slate-400">Nashr etilgan e'lonlar soni</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconAlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Yangi shikoyatlar</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-rose-300 tabular-nums">{newComplaints}</p>
          <p className="text-[11px] text-slate-400">Jarayonda yoki yangi murojaatlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconFileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Oxirgi oy hisobotlari</p>
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-300 tabular-nums">{reportsCount}</p>
          <p className="text-[11px] text-slate-400">Yuborilgan oylik hisobotlar</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <IconMegaphone className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight">So'nggi e'lonlar</h2>
              <p className="text-[11px] text-slate-400">Mahalla yangiliklari va e'lonlari ro'yxati.</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-800">
            {isLoading && <li className="px-4 py-3 text-xs text-slate-400">Yuklanmoqda...</li>}
            {!isLoading &&
              posts.map((p) => (
                <li key={p.id} className="px-4 py-3 hover:bg-slate-800/60 transition-colors">
                  <p className="text-xs font-medium text-slate-50">{p.title}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{p.content}</p>
                </li>
              ))}
            {!isLoading && posts.length === 0 && (
              <li className="px-4 py-3 text-xs text-slate-400">E'lonlar topilmadi.</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <IconMessageCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Yangi shikoyatlar</h2>
              <p className="text-[11px] text-slate-400">Fuqarolardan kelgan murojaatlar va ularning holati.</p>
            </div>
          </div>
          <ul className="divide-y divide-slate-800">
            {isLoading && <li className="px-4 py-3 text-xs text-slate-400">Yuklanmoqda...</li>}
            {!isLoading &&
              complaints.map((c) => (
                <li key={c.id} className="px-4 py-3 hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-50">{c.category}</p>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                        c.status === "NEW"
                          ? "bg-rose-500/20 text-rose-200 border-rose-400/30"
                          : "bg-amber-500/20 text-amber-200 border-amber-400/30"
                      }`}
                    >
                      {c.status === "NEW" ? "Yangi" : "Jarayonda"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{c.description}</p>
                </li>
              ))}
            {!isLoading && complaints.length === 0 && (
              <li className="px-4 py-3 text-xs text-slate-400">Shikoyatlar topilmadi.</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}

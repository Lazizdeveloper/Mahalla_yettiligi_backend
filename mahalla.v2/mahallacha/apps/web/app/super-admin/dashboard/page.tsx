"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  getDashboardSummary,
  listAuditLogs,
  listMahallas,
  listUsers,
  type ApiAuditLog
} from "@/lib/api";

interface MahallaRow {
  id: string;
  name: string;
  region: string;
  district: string;
  score: number;
  complaints: number;
}

const toRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMin < 60) {
    return `${diffMin} daqiqa oldin`;
  }

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour} soat oldin`;
  }

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} kun oldin`;
};

const toActivityType = (action: string): "report" | "complaint" | "user" => {
  const upper = action.toUpperCase();
  if (upper.includes("COMPLAINT")) {
    return "complaint";
  }
  if (upper.includes("USER")) {
    return "user";
  }
  return "report";
};

export default function SuperAdminDashboardPage() {
  const [mahallas, setMahallas] = useState<MahallaRow[]>([]);
  const [activity, setActivity] = useState<ApiAuditLog[]>([]);
  const [summary, setSummary] = useState<{
    averageMonthlyRating: number;
    totalComplaints: number;
    slaCompliance: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [mahallaRes, summaryRes, auditRes] = await Promise.all([
          listMahallas({ page: 1, pageSize: 20 }),
          getDashboardSummary(),
          listAuditLogs({ page: 1, pageSize: 8 })
        ]);

        const mahallaRows = await Promise.all(
          mahallaRes.items.map(async (m) => {
            try {
              const one = await getDashboardSummary({ mahallaId: m.id });
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: one.averageMonthlyRating ?? 0,
                complaints: one.totalComplaints ?? 0
              };
            } catch {
              return {
                id: m.id,
                name: m.name,
                region: m.district?.region?.name ?? "-",
                district: m.district?.name ?? "-",
                score: summaryRes.averageMonthlyRating ?? 0,
                complaints: 0
              };
            }
          })
        );

        setMahallas(mahallaRows);
        setSummary({
          averageMonthlyRating: summaryRes.averageMonthlyRating,
          totalComplaints: summaryRes.totalComplaints,
          slaCompliance: summaryRes.slaCompliance
        });
        setActivity(auditRes.items);

        await listUsers({ page: 1, pageSize: 1 });
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

  const avgScore = summary?.averageMonthlyRating ?? 0;
  const totalComplaints = summary?.totalComplaints ?? mahallas.reduce((sum, m) => sum + m.complaints, 0);
  const slaSuccess = (summary?.slaCompliance ?? 0) / 100;

  const uiActivity = useMemo(
    () =>
      activity.map((a) => ({
        id: a.id,
        type: toActivityType(a.action),
        title: `${a.action} (${a.entityType})`,
        time: toRelativeTime(a.createdAt)
      })),
    [activity]
  );

  return (
    <main className="p-6 space-y-6 bg-slate-50">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            Mahalla tizimining umumiy holati, reytinglar va so'nggi faolliklar.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          Real-time monitoring
        </div>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">Umumiy reyting</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{avgScore.toFixed(2)}</p>
          <p className="mt-1 text-xs text-gray-500">Mahallalar bo'yicha o'rtacha ball</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">Jami mahallalar</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{mahallas.length}</p>
          <p className="mt-1 text-xs text-gray-500">Tizimga ulangan mahallalar soni</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px]">
          <p className="text-xs font-medium text-gray-500">SLA bajarilishi</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{Math.round(slaSuccess * 100)}%</p>
          <p className="mt-1 text-xs text-gray-500">24 soat ichida yopilgan shikoyatlar ulushi</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Mahallalar reytingi va shikoyatlar</h2>
              <p className="text-xs text-gray-500">
                Har bir mahalla uchun o'rtacha ball va tushgan shikoyatlar soni.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Nazorat paneli
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <div className="inline-flex items-center gap-1">
              <span className="h-1.5 w-6 rounded-full bg-blue-500" />
              <span>Reyting (0-5 ball)</span>
            </div>
            <div className="inline-flex items-center gap-1">
              <span className="h-1.5 w-6 rounded-full bg-rose-500" />
              <span>Shikoyatlar ulushi</span>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-gray-500">Yuklanmoqda...</p>}
            {!isLoading &&
              mahallas.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 hover:bg-slate-50 transition-colors transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {m.region}, {m.district}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        Reyting: {m.score.toFixed(2)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                        Shikoyatlar: {m.complaints}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${(m.score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-200"
                        style={{ width: `${totalComplaints > 0 ? (m.complaints / totalComplaints) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold">So'nggi faolliklar</h2>
          <p className="text-xs text-gray-500">Tizim bo'yicha oxirgi muhim harakatlar.</p>
          <ul className="mt-2 space-y-2 text-sm">
            {uiActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 hover:bg-slate-50 transition-colors transition-transform duration-150 hover:-translate-y-[1px] hover:shadow-sm"
              >
                <span
                  className={
                    "mt-1 h-2 w-2 rounded-full " +
                    (a.type === "report"
                      ? "bg-blue-500"
                      : a.type === "complaint"
                      ? "bg-rose-500"
                      : "bg-emerald-500")
                  }
                />
                <div>
                  <p className="font-medium text-xs">{a.title}</p>
                  <p className="text-[11px] text-gray-500">{a.time}</p>
                </div>
              </li>
            ))}
            {!isLoading && uiActivity.length === 0 && (
              <li className="text-xs text-gray-500">Faolliklar topilmadi.</li>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, checkIn, checkOut, getDailyStats, type DailyStatsResponse } from "@/lib/api";
import { IconClock, IconUsers, IconCheckCircle, IconPlus } from "../icons";

interface SessionRow {
  id: string;
  fullName: string;
  role: string;
  checkIn: string;
  checkOut: string | null;
  status: "online" | "offline" | "outside";
}

export default function MahallaWorktimePage() {
  const [stats, setStats] = useState<DailyStatsResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [status, setStatus] = useState<"online" | "offline" | "outside">("online");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStats = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getDailyStats();
      setStats(response);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Ish vaqti statistikalarini yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const sessions = useMemo<SessionRow[]>(() => {
    if (!stats) {
      return [];
    }

    return stats.sessions.map((session) => ({
      id: session.id,
      fullName: fullName || "Joriy foydalanuvchi",
      role: role || "Xodim",
      checkIn: new Date(session.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      checkOut: session.checkOutAt
        ? new Date(session.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null,
      status:
        session.status === "OPEN"
          ? "online"
          : session.outsideMinutes > 0
          ? "outside"
          : "offline"
    }));
  }, [stats, fullName, role]);

  const online = useMemo(() => sessions.filter((s) => s.status === "online").length, [sessions]);
  const outside = useMemo(() => sessions.filter((s) => s.status === "outside").length, [sessions]);
  const total = sessions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      if (status === "online") {
        await checkIn();
      } else {
        await checkOut();
      }
      setCheckInTime("");
      await loadStats();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Amalni bajarishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <IconClock className="w-6 h-6 text-sky-400 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">Ish vaqti</h1>
        </div>
        <p className="text-sm text-slate-300 font-normal">
          Mahalla Yettiligi xodimlarining kunlik check-in/check-out ma'lumotlari.
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
            <IconClock className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Bugungi smenalar</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-sky-300 tabular-nums">{total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Tizimda qayd etilgan xodimlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Hozir onlayn</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-300 tabular-nums">{online}</p>
          <p className="mt-1 text-[11px] text-slate-400">Mahallada faol ishlayotganlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconUsers className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Hududdan tashqarida</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-300 tabular-nums">{outside}</p>
          <p className="mt-1 text-[11px] text-slate-400">Xizmat safarida</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-4 space-y-3" onSubmit={handleSubmit}>
          <h2 className="text-sm font-semibold text-slate-50 tracking-tight flex items-center gap-2">
            <IconPlus className="w-4 h-4 text-sky-400" />
            Yangi ish smenasini qo'shish
          </h2>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Xodim FIO</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: Mahalla Yettiligi 4"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Lavozim</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: Xodim"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Check-in vaqti</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "online" | "offline" | "outside")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="online">Onlayn</option>
              <option value="outside">Tashqarida</option>
              <option value="offline">Smena tugagan</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            {isSaving ? "Bajarilmoqda..." : "Xodimni qo'shish"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <IconClock className="w-4 h-4 text-sky-400 shrink-0" />
              <h2 className="text-sm font-semibold tracking-tight">Bugungi ish smenalari</h2>
            </div>
            <p className="text-[11px] text-slate-400">Check-in / check-out va holat bo'yicha ro'yxat.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Xodim</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Lavozim</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Check-in</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Check-out</th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="border border-slate-800 px-3 py-3 text-center text-slate-400" colSpan={5}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-50">{s.fullName}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">{s.role}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-200">{s.checkIn}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-200">{s.checkOut ?? "-"}</td>
                      <td className="border border-slate-800 px-3 py-2 text-center">
                        {s.status === "online" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            Onlayn
                          </span>
                        )}
                        {s.status === "offline" && (
                          <span className="inline-flex items-center rounded-full bg-slate-500/20 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                            Smena tugagan
                          </span>
                        )}
                        {s.status === "outside" && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Tashqarida
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && sessions.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">Bugungi session topilmadi.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

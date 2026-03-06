"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, getDailyStats, type DailyStatsResponse } from "@/lib/api";

interface StaffSessionSummary {
  id: string;
  fullName: string;
  role: string;
  mahalla: string;
  checkIn: string;
  checkOut: string | null;
  status: "online" | "offline" | "outside";
}

export default function HokimiyatWorktimePage() {
  const [stats, setStats] = useState<DailyStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
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
          setErrorMessage("Ish vaqti ma'lumotlarini yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const sessions = useMemo<StaffSessionSummary[]>(() => {
    if (!stats) {
      return [];
    }

    return stats.sessions.map((s) => ({
      id: s.id,
      fullName: "Mahalla inspektori",
      role: "Mahalla xodimi",
      mahalla: "Mahalla",
      checkIn: new Date(s.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      checkOut: s.checkOutAt
        ? new Date(s.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null,
      status:
        s.status === "OPEN"
          ? "online"
          : s.outsideMinutes > 0
          ? "outside"
          : "offline"
    }));
  }, [stats]);

  const online = sessions.filter((s) => s.status === "online").length;
  const outside = sessions.filter((s) => s.status === "outside").length;
  const total = sessions.length;

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Ish vaqti nazorati</h1>
        <p className="text-sm text-slate-300">
          Mahalla xodimlarining bugungi check-in/check-out holati va hududdan tashqarida bo'lish statistikasi.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Bugungi smenalar</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-sky-300">{total}</p>
          <p className="mt-1 text-[11px] text-slate-400">Tizimda qayd etilgan xodimlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Hozir onlayn</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">{online}</p>
          <p className="mt-1 text-[11px] text-slate-400">Mahallada faol ishlayotganlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Hududdan tashqarida</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-300">{outside}</p>
          <p className="mt-1 text-[11px] text-slate-400">Xizmat safarida yoki hududdan tashqarida</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Bugungi ish smenalari</h2>
          <p className="text-[11px] text-slate-400">Mahalla xodimlarining asosiy holati va ish vaqti bo'yicha qisqa ro'yxat.</p>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-900/80">
              <th className="border border-slate-800 px-2 py-1 text-left text-xs text-slate-300">Xodim</th>
              <th className="border border-slate-800 px-2 py-1 text-left text-xs text-slate-300">Mahalla</th>
              <th className="border border-slate-800 px-2 py-1 text-left text-xs text-slate-300">Check-in</th>
              <th className="border border-slate-800 px-2 py-1 text-left text-xs text-slate-300">Check-out</th>
              <th className="border border-slate-800 px-2 py-1 text-center text-xs text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="border border-slate-800 px-2 py-3 text-center text-slate-400" colSpan={5}>
                  Yuklanmoqda...
                </td>
              </tr>
            )}
            {!isLoading &&
              sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/70 transition-colors odd:bg-slate-900/40 even:bg-slate-900/20">
                  <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-50">
                    {s.fullName}
                    <span className="ml-1 text-[10px] text-slate-400">({s.role})</span>
                  </td>
                  <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-200">{s.mahalla}</td>
                  <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-200">{s.checkIn}</td>
                  <td className="border border-slate-800 px-2 py-1 align-middle text-xs text-slate-200">{s.checkOut ?? "-"}</td>
                  <td className="border border-slate-800 px-2 py-1 align-middle text-center text-xs">
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
                        Hududdan tashqarida
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

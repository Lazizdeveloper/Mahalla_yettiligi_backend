"use client";

import { useEffect, useState } from "react";
import { Users, Home, Target } from "lucide-react";
import { ApiError, listEvents, type ApiEvent } from "@/lib/api";

export default function ResidentEventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await listEvents({ page: 1, pageSize: 30 });
        setEvents(response.items);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Tadbirlarni yuklashda xatolik.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="relative min-h-screen w-full max-w-full p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 pb-24 sm:pb-6 transition-colors duration-200 box-border text-white">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Mahalla tadbirlari</h1>
        <p className="text-xs sm:text-sm text-slate-300 font-normal">
          Yaqinlashib kelayotgan yig'ilishlar, hasharlar va yoshlar uchun tadbirlar ro'yxati.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="resident-card p-4">
        <h2 className="text-sm font-semibold text-white mb-1">Yaqin tadbirlar</h2>
        <p className="text-xs text-slate-400 mb-4">Taqvimni kuzatib boring va kerak bo'lsa, tadbirga tayyorlaning</p>
        <ul className="divide-y divide-white/10 text-sm">
          {isLoading && <li className="py-3 text-xs text-slate-400">Yuklanmoqda...</li>}
          {!isLoading &&
            events.map((e) => {
              const iconMap = {
                meeting: { Icon: Users, bg: "bg-blue-500/20 text-blue-300" },
                community: { Icon: Home, bg: "bg-emerald-500/20 text-emerald-300" },
                youth: { Icon: Target, bg: "bg-amber-500/20 text-amber-300" }
              } as const;
              const type = e.title.toLowerCase().includes("yosh")
                ? "youth"
                : e.title.toLowerCase().includes("yig")
                ? "meeting"
                : "community";
              const { Icon, bg } = iconMap[type];

              return (
                <li key={e.id} className="group flex items-start gap-3 py-3 first:pt-0 hover:bg-white/5 rounded-lg transition-colors -mx-1 px-3">
                  <span className={`resident-icon-box mt-0.5 h-10 w-10 rounded-xl ${bg} group-hover:bg-white/10`}>
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{e.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{e.locationName ?? "Manzil ko'rsatilmagan"}</p>
                    <p className="text-xs text-violet-300 mt-0.5">{new Date(e.scheduledAt).toLocaleString()}</p>
                  </div>
                </li>
              );
            })}
          {!isLoading && events.length === 0 && <li className="py-3 text-xs text-slate-400">Tadbirlar topilmadi.</li>}
        </ul>
      </section>
    </main>
  );
}

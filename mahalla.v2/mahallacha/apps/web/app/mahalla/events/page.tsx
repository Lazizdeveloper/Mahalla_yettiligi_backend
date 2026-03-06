"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, createEvent, listEvents, type ApiEvent } from "@/lib/api";
import { IconCalendar, IconCheckCircle, IconClock, IconPlus } from "../icons";

export default function MahallaEventsPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState<number | "">("");
  const [status, setStatus] = useState<"PLANNED" | "COMPLETED" | "CANCELLED">("PLANNED");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadEvents = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listEvents({ page: 1, pageSize: 100 });
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

  useEffect(() => {
    void loadEvents();
  }, []);

  const planned = useMemo(() => events.filter((e) => e.status === "PLANNED").length, [events]);
  const completed = useMemo(() => events.filter((e) => e.status === "COMPLETED").length, [events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await createEvent({
        title,
        scheduledAt: new Date(`${date}T09:00:00`).toISOString(),
        locationName: location,
        participantCount: typeof participants === "number" ? participants : 0
      });
      setTitle("");
      setDate("");
      setLocation("");
      setParticipants("");
      setStatus("PLANNED");
      await loadEvents();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Tadbir yaratishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <IconCalendar className="w-6 h-6 text-sky-400 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">Tadbir rejalashtirish</h1>
        </div>
        <p className="text-sm text-slate-300 font-normal">
          Mahalla tadbirlari - sana, joy, ishtirokchilar.
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
            <IconCalendar className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Jami tadbirlar</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-sky-300 tabular-nums">{events.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Ro'yxatdagi tadbirlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Rejalashtirilgan</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-300 tabular-nums">{planned}</p>
          <p className="mt-1 text-[11px] text-slate-400">Kutilayotgan tadbirlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">O'tgan</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-300 tabular-nums">{completed}</p>
          <p className="mt-1 text-[11px] text-slate-400">Bajarilgan tadbirlar</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-4 space-y-3" onSubmit={handleSubmit}>
          <h2 className="text-sm font-semibold text-slate-50 tracking-tight flex items-center gap-2">
            <IconPlus className="w-4 h-4 text-sky-400" />
            Yangi tadbir yaratish
          </h2>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Nomi</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: Mahalla yig'ilishi"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Sana</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Joy</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: Mahalla markazi"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Kutilayotgan ishtirokchilar</label>
            <input
              type="number"
              min={0}
              value={participants}
              onChange={(e) => setParticipants(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: 50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "PLANNED" | "COMPLETED" | "CANCELLED")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="PLANNED">Rejalashtirilgan</option>
              <option value="COMPLETED">O'tgan</option>
              <option value="CANCELLED">Bekor qilingan</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition"
          >
            {isSaving ? "Saqlanmoqda..." : "Tadbirni saqlash"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <IconCalendar className="w-4 h-4 text-sky-400 shrink-0" />
              <h2 className="text-sm font-semibold tracking-tight">Tadbirlar ro'yxati</h2>
            </div>
            <p className="text-[11px] text-slate-400">Sana, joy va ishtirokchilar soni bo'yicha ro'yxat.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Tadbir</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Sana</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Joy</th>
                  <th className="border border-slate-800 px-3 py-2 text-right font-medium">Ishtirokchilar</th>
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
                  events.map((e) => (
                    <tr
                      key={e.id}
                      className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="border border-slate-800 px-3 py-2 text-xs font-medium text-slate-50">{e.title}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">{new Date(e.scheduledAt).toLocaleDateString()}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">{e.locationName ?? "-"}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-right text-slate-200">{e.participantCount}</td>
                      <td className="border border-slate-800 px-3 py-2 text-center">
                        {e.status === "PLANNED" && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Rejalashtirilgan
                          </span>
                        )}
                        {e.status === "COMPLETED" && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            O'tgan
                          </span>
                        )}
                        {e.status === "CANCELLED" && (
                          <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-200">
                            Bekor qilindi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && events.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">Tadbirlar topilmadi.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

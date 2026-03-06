"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Megaphone, BarChart3, PartyPopper, ChevronRight } from "lucide-react";
import { StaggerContainer, StaggerItem } from "../components/StaggerContainer";
import { ApiError, listComplaints, listEvents, listMonthlyReports, listPosts, type ApiComplaint, type ApiEvent, type ApiMonthlyReport, type ApiPost } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export default function ResidentDashboardPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [reports, setReports] = useState<ApiMonthlyReport[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const sessionUser = getSessionUser();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [postsRes, complaintsRes, reportsRes, eventsRes] = await Promise.all([
          listPosts({ page: 1, pageSize: 10 }),
          listComplaints({ page: 1, pageSize: 10 }),
          listMonthlyReports({ page: 1, pageSize: 10 }),
          listEvents({ page: 1, pageSize: 10 })
        ]);
        setPosts(postsRes.items);
        setComplaints(complaintsRes.items);
        setReports(reportsRes.items);
        setEvents(eventsRes.items);
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

  const ratingsCount = useMemo(() => {
    const myId = sessionUser?.id;
    if (!myId) {
      return 0;
    }
    return reports.reduce((sum, report) => sum + (report.ratings?.filter((r) => r.userId === myId).length ?? 0), 0);
  }, [reports, sessionUser]);

  const userName = sessionUser?.fullName ?? "Foydalanuvchi";
  const mahallaName = "Mahalla";

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-hidden p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 pb-24 sm:pb-6 transition-colors duration-300 box-border text-white">
      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <StaggerContainer className="relative z-10 w-full max-w-full space-y-4 sm:space-y-5 md:space-y-6">
        <StaggerItem>
          <section className="resident-card resident-card-hover relative rounded-2xl overflow-hidden px-4 sm:px-5 py-4 sm:py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-indigo-500/20 pointer-events-none" />
            <div className="relative z-10 space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Salom, {userName}</h1>
              <p className="text-sm text-slate-300">Mahalla: {mahallaName}</p>
              <p className="text-xs text-slate-400 max-w-xl mt-1">Yangi e'lonlar, murojaatlaringiz va hisobotlar bo'yicha qisqa ko'rsatkichlar.</p>
            </div>
            <div className="relative z-10 flex flex-wrap gap-3">
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 min-w-[100px]">
                <p className="text-xs text-slate-300">E'lonlar</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-white">{posts.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 min-w-[100px]">
                <p className="text-xs text-slate-300">Murojaatlar</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-white">{complaints.length}</p>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-4 py-3 min-w-[100px]">
                <p className="text-xs text-slate-300">Baholar</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-white">{ratingsCount}</p>
              </div>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { href: "/resident/complaints", Icon: Mail, iconBg: "bg-sky-500/20 text-sky-300", title: "Shikoyat yuborish", subtitle: "Shikoyat yoki taklif qoldiring" },
              { href: "/resident/dashboard#announcements", Icon: Megaphone, iconBg: "bg-amber-500/20 text-amber-300", title: "E'lonlar", subtitle: "Mahalla yangiliklarini ko'ring" },
              { href: "/resident/reports", Icon: BarChart3, iconBg: "bg-emerald-500/20 text-emerald-300", title: "Oylik baholash", subtitle: "Hisobotlarga baho bering" },
              { href: "/resident/events", Icon: PartyPopper, iconBg: "bg-violet-500/20 text-violet-300", title: "Tadbirlar", subtitle: "Yaqin tadbirlarni ko'ring" }
            ].map((item) => (
              <a key={item.href} href={item.href} className="resident-card resident-card-hover flex items-center gap-4 p-4 min-h-0 group">
                <span className={`resident-icon-box h-12 w-12 ${item.iconBg} group-hover:bg-white/10`}>
                  <item.Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
                </div>
                <ChevronRight className="resident-chevron h-5 w-5 text-slate-400 group-hover:text-white shrink-0" aria-hidden />
              </a>
            ))}
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="resident-card resident-card-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Yangi e'lonlar</p>
              <p className="mt-2 text-2xl font-bold text-white tabular-nums">{posts.length}</p>
              <p className="text-xs text-slate-400 mt-1">Mahallangiz bo'yicha oxirgi e'lonlar soni</p>
            </div>
            <div className="resident-card resident-card-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Mening shikoyatlarim</p>
              <p className="mt-2 text-2xl font-bold text-white tabular-nums">{complaints.length}</p>
              <p className="text-xs text-slate-400 mt-1">Ochilmagan yoki jarayondagi murojaatlar</p>
            </div>
            <div className="resident-card resident-card-hover p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Baholangan hisobotlar</p>
              <p className="mt-2 text-2xl font-bold text-white tabular-nums">{ratingsCount}</p>
              <p className="text-xs text-slate-400 mt-1">Siz fikr bildirgan oylik hisobotlar</p>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            <div className="resident-card overflow-hidden min-h-0" id="announcements">
              <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">So'nggi e'lonlar</h2>
                <p className="text-xs text-slate-400 mt-0.5">Mahallangiz bo'yicha eng so'nggi yangiliklar</p>
              </div>
              <ul className="divide-y divide-white/10 text-sm">
                {isLoading && <li className="px-4 py-3 text-xs text-slate-400">Yuklanmoqda...</li>}
                {!isLoading &&
                  posts.map((p) => (
                    <li key={p.id} className="group/list px-4 py-3 hover:bg-white/5 transition-colors rounded-lg mx-2 my-1 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{p.title}</p>
                        <p className="text-slate-400 line-clamp-2 text-xs mt-0.5">{p.content}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover/list:text-white transition-all duration-300 group-hover/list:translate-x-0.5 shrink-0" aria-hidden />
                    </li>
                  ))}
              </ul>
            </div>
            <div className="resident-card overflow-hidden min-h-0">
              <div className="px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-semibold text-white">Mening shikoyatlarim</h2>
                <p className="text-xs text-slate-400 mt-0.5">Yuborgan murojaatlaringizning ro'yxati</p>
              </div>
              <ul className="divide-y divide-white/10 text-sm">
                {isLoading && <li className="px-4 py-3 text-xs text-slate-400">Yuklanmoqda...</li>}
                {!isLoading &&
                  complaints.map((c) => (
                    <li key={c.id} className="group/list px-4 py-3 hover:bg-white/5 transition-colors rounded-lg mx-2 my-1 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{c.category}</p>
                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{c.description}</p>
                        <p className="mt-1 text-xs text-slate-500">Status: {c.status}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover/list:text-white transition-all duration-300 group-hover/list:translate-x-0.5 shrink-0" aria-hidden />
                    </li>
                  ))}
              </ul>
            </div>
          </section>
        </StaggerItem>

        <StaggerItem>
          <section className="resident-card overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">Yaqin tadbirlar</h2>
                <p className="text-xs text-slate-400 mt-0.5">Kelgusi tadbirlar jadvali</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <ul className="px-4 py-3 space-y-2 text-xs">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-violet-400 shrink-0" />
                  <div>
                    <p className="text-slate-200">
                      <span className="font-medium text-white">{event.title}</span> - {event.locationName ?? "Manzil yo'q"}
                    </p>
                    <p className="text-[11px] text-slate-500">{new Date(event.scheduledAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </StaggerItem>
      </StaggerContainer>
    </main>
  );
}

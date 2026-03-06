"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldAlert, Users, MapPinned, ScrollText } from "lucide-react";
import {
  ApiError,
  clearSession,
  getDashboardCharts,
  getDashboardSummary,
  getSessionUser,
  listAuditLogs,
  listMahallas,
  listUsers,
  panelAllowsRole
} from "@mmbp/shared";

type ChartRow = { day: string; count: number };
type CategoryRow = { day: string; count: number };

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-lg border bg-white ${className}`}>{children}</div>;
}

function CardHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={className}>{children}</h3>;
}

function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>;
}

const toShortDay = (dateString: string) =>
  new Date(dateString).toLocaleDateString("uz-UZ", { weekday: "short" });

const formatTimeAgo = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.max(1, Math.floor(diffMs / 60_000));
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

export default function OverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpiData, setKpiData] = useState({
    totalUsers: 0,
    activeSessions: 0,
    mahallas: 0,
    audit24h: 0
  });
  const [auditTrend, setAuditTrend] = useState<ChartRow[]>([]);
  const [otpFailures, setOtpFailures] = useState<CategoryRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ id: string; type: "auth" | "user" | "role" | "security"; title: string; time: string }>
  >([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || !panelAllowsRole("super-admin", user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [users, mahallas, auditLogs, summary, charts] = await Promise.all([
          listUsers({ page: 1, pageSize: 1 }),
          listMahallas({ page: 1, pageSize: 1 }),
          listAuditLogs({ page: 1, pageSize: 200 }),
          getDashboardSummary(),
          getDashboardCharts({ months: 6 })
        ]);

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const activeActorIds = new Set(
          auditLogs.items
            .filter((log) => {
              const ts = new Date(log.createdAt).getTime();
              return ts >= oneHourAgo && typeof log.actorId === "string";
            })
            .map((log) => log.actorId as string)
        );

        const audit24h = auditLogs.items.filter((log) => new Date(log.createdAt).getTime() >= oneDayAgo).length;

        setKpiData({
          totalUsers: users.total,
          activeSessions: activeActorIds.size,
          mahallas: mahallas.total,
          audit24h
        });

        const buckets: Record<string, ChartRow> = {};
        for (let i = 6; i >= 0; i -= 1) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toISOString().slice(0, 10);
          buckets[key] = { day: toShortDay(date.toISOString()), count: 0 };
        }
        for (const log of auditLogs.items) {
          const key = log.createdAt.slice(0, 10);
          if (buckets[key]) {
            buckets[key].count += 1;
          }
        }
        setAuditTrend(Object.values(buckets));

        if (charts.complaintsByCategory.length > 0) {
          setOtpFailures(
            charts.complaintsByCategory.slice(0, 7).map((item) => ({
              day: item.category,
              count: item.value
            }))
          );
        } else {
          setOtpFailures(
            charts.ratingLine.map((item) => ({
              day: item.month,
              count: Number(item.value.toFixed(0))
            }))
          );
        }

        setRecentActivity(
          auditLogs.items.slice(0, 5).map((log) => {
            const action = log.action.toUpperCase();
            const type: "auth" | "user" | "role" | "security" =
              action.includes("OTP") || action.includes("SECURITY")
                ? "security"
                : action.includes("USER")
                ? "user"
                : action.includes("ROLE")
                ? "role"
                : "auth";

            return {
              id: log.id,
              type,
              title: `${log.action} (${log.entityType})`,
              time: formatTimeAgo(log.createdAt)
            };
          })
        );

        if (summary.totalComplaints === 0 && users.total === 0) {
          setError("Ma'lumot topilmadi. Seed ma'lumotlarini tekshiring.");
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          if (err.status === 401) {
            clearSession();
            router.replace("/login");
          }
        } else {
          setError("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const systemHealth = useMemo(
    () => [
      { name: "PostgreSQL", status: "Healthy", color: "text-emerald-700 bg-emerald-50" },
      { name: "Redis", status: "Healthy", color: "text-emerald-700 bg-emerald-50" },
      { name: "Kafka", status: "Degraded", color: "text-amber-700 bg-amber-50" },
      { name: "Search (Elasticsearch)", status: "Healthy", color: "text-emerald-700 bg-emerald-50" }
    ],
    []
  );

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-gray-600">
            Tizimning umumiy holati, foydalanuvchilar, mahallalar va xavfsizlik bo'yicha qisqacha ko'rinish.
          </p>
        </div>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "..." : kpiData.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Tizimdagi jami foydalanuvchilar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Active Sessions</CardTitle>
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "..." : kpiData.activeSessions}</div>
            <p className="text-xs text-gray-500 mt-1">So'nggi 1 soatdagi faol aktorlar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Mahallas</CardTitle>
            <MapPinned className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "..." : kpiData.mahallas}</div>
            <p className="text-xs text-gray-500 mt-1">Monitoring qilinayotgan mahallalar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Audit 24 soat</CardTitle>
            <ScrollText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{loading ? "..." : kpiData.audit24h}</div>
            <p className="text-xs text-gray-500 mt-1">So'nggi 24 soatdagi audit yozuvlari</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Audit events trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={auditTrend}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Complaints by category</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={otpFailures}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <span
                    className={
                      "mt-1 h-2 w-2 rounded-full " +
                      (a.type === "auth" ? "bg-emerald-500" : a.type === "security" ? "bg-rose-500" : "bg-blue-500")
                    }
                  />
                  <div>
                    <p className="font-medium text-xs">{a.title}</p>
                    <p className="text-[11px] text-gray-500">{a.time}</p>
                  </div>
                </li>
              ))}
              {!loading && recentActivity.length === 0 ? <li className="text-xs text-gray-500">Hali yozuv yo'q.</li> : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">System health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {systemHealth.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span>{item.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

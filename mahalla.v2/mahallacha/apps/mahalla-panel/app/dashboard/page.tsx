"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiComplaint,
  ApiError,
  ApiMonthlyReport,
  ApiPost,
  clearSession,
  getSessionUser,
  listComplaints,
  listMonthlyReports,
  listPosts,
  panelAllowsRole
} from "@mmbp/shared";

export default function MahallaDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [reports, setReports] = useState<ApiMonthlyReport[]>([]);

  useEffect(() => {
    const user = getSessionUser();
    if (!user || !panelAllowsRole("mahalla", user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [postRes, complaintRes, reportRes] = await Promise.all([
          listPosts({ page: 1, pageSize: 5 }),
          listComplaints({ page: 1, pageSize: 5 }),
          listMonthlyReports({ page: 1, pageSize: 5 })
        ]);

        setPosts(postRes.items);
        setComplaints(complaintRes.items);
        setReports(reportRes.items);
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

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mahalla Dashboard</h1>
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Faol e'lonlar</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "..." : posts.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Yangi shikoyatlar</p>
          <p className="mt-2 text-2xl font-semibold">
            {loading ? "..." : complaints.filter((c) => c.status === "NEW").length}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Oxirgi oy hisobotlari</p>
          <p className="mt-2 text-2xl font-semibold">{loading ? "..." : reports.length}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">So'nggi e'lonlar</h2>
          <ul className="space-y-2 text-sm">
            {posts.map((p) => (
              <li key={p.id} className="border rounded px-3 py-2">
                <p className="font-medium">{p.title}</p>
                <p className="text-gray-600 line-clamp-2">{p.content}</p>
              </li>
            ))}
            {!loading && posts.length === 0 ? <li className="text-xs text-gray-500">Ma'lumot yo'q.</li> : null}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Yangi shikoyatlar</h2>
          <ul className="space-y-2 text-sm">
            {complaints.map((c) => (
              <li key={c.id} className="border rounded px-3 py-2">
                <p className="font-medium">{c.category}</p>
                <p className="text-gray-600 line-clamp-2">{c.description}</p>
              </li>
            ))}
            {!loading && complaints.length === 0 ? <li className="text-xs text-gray-500">Ma'lumot yo'q.</li> : null}
          </ul>
        </div>
      </section>
    </main>
  );
}

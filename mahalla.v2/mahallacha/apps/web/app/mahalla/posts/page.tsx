"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, archivePost, createPost, listPosts, publishPost, type ApiPost } from "@/lib/api";
import { IconMegaphone, IconFileText, IconPlus, IconCheckCircle } from "../icons";

export default function MahallaPostsPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadPosts = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listPosts({ page: 1, pageSize: 100 });
      setPosts(response.items);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("E'lonlarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const published = useMemo(() => posts.filter((p) => p.status === "PUBLISHED").length, [posts]);
  const drafts = useMemo(() => posts.filter((p) => p.status === "DRAFT").length, [posts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const created = await createPost({
        title,
        content
      });

      if (status === "published") {
        await publishPost(created.id);
      }

      setTitle("");
      setContent("");
      setStatus("draft");
      await loadPosts();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("E'lon yaratishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (id: string) => {
    setErrorMessage("");
    try {
      await archivePost(id);
      await loadPosts();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("E'lonni arxivlashda xatolik.");
      }
    }
  };

  return (
    <main className="p-6 space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <IconMegaphone className="w-6 h-6 text-sky-400 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">Mahalla e'lonlari</h1>
        </div>
        <p className="text-sm text-slate-300 font-normal">
          Mahalla yangiliklari va e'lonlarini yaratish va tahrirlash.
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
            <IconMegaphone className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Jami e'lonlar</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-sky-300 tabular-nums">{posts.length}</p>
          <p className="mt-1 text-[11px] text-slate-400">Yaratilgan e'lonlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Nashr etilgan</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-300 tabular-nums">{published}</p>
          <p className="mt-1 text-[11px] text-slate-400">Jamoat ko'rinishidagi e'lonlar</p>
        </div>
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <IconFileText className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">Qoralama</p>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-amber-300 tabular-nums">{drafts}</p>
          <p className="mt-1 text-[11px] text-slate-400">Tayyorlanayotgan e'lonlar</p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-4 space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-50 tracking-tight flex items-center gap-2">
            <IconPlus className="w-4 h-4 text-sky-400" />
            Yangi e'lon yaratish
          </h2>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Sarlavha</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              placeholder="Masalan: Mahalla yig'ilishi"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Matn</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 h-24"
              placeholder="E'lon matnini kiriting..."
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="draft">Qoralama</option>
              <option value="published">Nashr etilgan</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-sky-600 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition inline-flex items-center justify-center gap-1.5"
          >
            <IconPlus className="w-3.5 h-3.5" />
            {isSaving ? "Saqlanmoqda..." : "E'lonni saqlash"}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
            <IconMegaphone className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold tracking-tight">E'lonlar ro'yxati</h2>
              <p className="text-[11px] text-slate-400">Sarlavha, qisqacha matn va nashr sanasi.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-300">
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Sarlavha</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Qisqacha</th>
                  <th className="border border-slate-800 px-3 py-2 text-left font-medium">Nashr sanasi</th>
                  <th className="border border-slate-800 px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="border border-slate-800 px-3 py-3 text-center text-slate-400" colSpan={4}>
                      Yuklanmoqda...
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  posts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-800/80 odd:bg-slate-900/40 even:bg-slate-900/20 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="border border-slate-800 px-3 py-2 text-xs font-medium text-slate-50">{p.title}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300 line-clamp-2 max-w-md">{p.content}</td>
                      <td className="border border-slate-800 px-3 py-2 text-xs text-slate-300">
                        {p.publishDate ? new Date(p.publishDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 text-center">
                        {p.status === "PUBLISHED" ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                            Nashr etilgan
                          </span>
                        ) : p.status === "ARCHIVED" ? (
                          <button
                            type="button"
                            onClick={() => void handleArchive(p.id)}
                            className="inline-flex items-center rounded-full bg-slate-500/20 px-2 py-0.5 text-[11px] font-medium text-slate-200"
                          >
                            Arxiv
                          </button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            Qoralama
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!isLoading && posts.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">E'lonlar topilmadi.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { ApiError, createComplaint, listComplaints, type ApiComplaint } from "@/lib/api";

export default function ResidentComplaintsPage() {
  const [complaints, setComplaints] = useState<ApiComplaint[]>([]);
  const [category, setCategory] = useState("Tozalik");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadComplaints = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await listComplaints({ page: 1, pageSize: 50 });
      setComplaints(response.items);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Murojaatlarni yuklashda xatolik.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      await createComplaint({
        category,
        description
      });
      setDescription("");
      setImagePreview(null);
      await loadComplaints();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Murojaat yuborishda xatolik.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatStatus = (status: ApiComplaint["status"]) => {
    switch (status) {
      case "NEW":
        return "Yangi";
      case "IN_PROGRESS":
        return "Jarayonda";
      case "ANSWERED":
        return "Yopilgan";
      case "REJECTED":
        return "Rad etilgan";
      default:
        return status;
    }
  };

  return (
    <main className="relative min-h-screen w-full max-w-full p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 pb-24 sm:pb-6 box-border text-white">
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Mening murojaatlarim</h1>
        <p className="text-xs sm:text-sm text-slate-300 font-normal">
          Mahallaga yuborgan shikoyat va murojaatlaringizni kuzatishingiz va yangilarini yuborishingiz mumkin.
        </p>
      </header>

      {errorMessage && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <form onSubmit={handleSubmit} className="resident-card resident-form p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Yangi murojaat yuborish</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Kategoriya</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option>Tozalik</option>
              <option>Infratuzilma</option>
              <option>Ijtimoiy</option>
              <option>Boshqa</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Muammo tafsiloti</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 h-24"
              placeholder="Qisqacha va tushunarli qilib yozing..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Rasm (ixtiyoriy)</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Tanlangan rasm" className="h-24 w-auto max-w-full rounded-lg object-cover border border-white/20" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/90 text-white hover:bg-rose-500 transition-colors"
                  aria-label="Rasmni olib tashlash"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/30 bg-white/5 px-4 py-6 text-sm text-slate-300 hover:border-violet-400/50 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Upload className="h-5 w-5" />
                <span>Rasm yuklash</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/30 transition hover:shadow-lg hover:shadow-violet-500/40"
          >
            {isSaving ? "Yuborilmoqda..." : "Murojaat yuborish"}
          </button>
        </form>

        <section className="resident-card lg:col-span-2 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Mavjud murojaatlar</h2>
              <p className="text-xs text-slate-400 mt-0.5">Siz yuborgan barcha murojaatlarning ro'yxati</p>
            </div>
            <span className="text-[11px] text-slate-400">
              Jami: <span className="font-semibold text-white">{complaints.length}</span>
            </span>
          </div>
          {isLoading ? (
            <p className="p-4 text-sm text-slate-400">Yuklanmoqda...</p>
          ) : complaints.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Hozircha hech qanday murojaat yubormagansiz.</p>
          ) : (
            <ul className="divide-y divide-white/10 text-sm">
              {complaints.map((c) => (
                <li key={c.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500">
                        ID: <span className="font-mono text-slate-300">{c.id.slice(0, 8)}</span> |{" "}
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                      <p className="font-medium text-white">{c.category}</p>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{c.description}</p>
                      {c.responseText && (
                        <p className="text-emerald-300 text-[11px] mt-1 line-clamp-2">
                          Javob: {c.responseText}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      {formatStatus(c.status)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Oxirgi yangilanish: {new Date(c.updatedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}

 "use client";

import React from "react";
import Link from "next/link";
import { Shield, MessageSquareWarning, BarChart3, Users } from "lucide-react";

const features = [
  {
    icon: MessageSquareWarning,
    title: "Shikoyat yuborish",
    description: "Muammolarni tezkor hal qilish uchun onlayn murojaat tizimi",
  },
  {
    icon: BarChart3,
    title: "Oylik hisobotlar",
    description: "Mahalla faoliyati haqida shaffof hisobotlar va baholash",
  },
  {
    icon: Shield,
    title: "Shaffoflik",
    description: "Barcha jarayonlar ochiq va kuzatiladigan tizim",
  },
  {
    icon: Users,
    title: "Jamoa aloqasi",
    description: "Tadbirlar va e'lonlar orqali mahalla bilan bog'lanish",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-sky-50 to-background motion-safe:animate-[fadeIn_0.6s_ease-out]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur transition-colors duration-300">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center shadow-sm transform transition-transform duration-300 hover:scale-105">
              <span className="text-white font-heading font-bold text-sm">M</span>
            </div>
            <span className="font-heading font-bold text-lg text-slate-900">MMBP</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-sky-400/70 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-800 hover:bg-sky-500/20 hover:border-sky-300 hover:text-sky-950 shadow-sm transition-colors duration-200"
            >
              Kirish
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0">
          {/* Agar rasm kerak bo'lsa, /public ichiga hero-banner.png qo'ying */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#22c55e33,transparent_55%),radial-gradient(circle_at_bottom_right,#0ea5e933,transparent_55%)]" />
          <img
            src="/hero-banner.png"
            alt="Mahalla"
            className="hidden md:block w-full h-full object-cover opacity-35 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-background" />
        </div>

        <div className="relative">
          <div className="container max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-28">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-center">
              {/* Left: main copy */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur motion-safe:animate-[fadeInUp_0.5s_ease-out]">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)] rounded-full motion-safe:animate-pulse" />
                  Mahalla Monitoring va Boshqaruv Platformasi
                </div>
                <div className="space-y-4">
                  <h1 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-slate-900 motion-safe:animate-[fadeInUp_0.6s_ease-out]">
                    Mahalla boshqaruvini{" "}
                    <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-500 bg-clip-text text-transparent">
                      raqamlashtiramiz
                    </span>
                  </h1>
                  <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed motion-safe:animate-[fadeInUp_0.7s_ease-out]">
                    Fuqarolar uchun shaffof, qulay va tezkor xizmat. Shikoyat yuboring,
                    tadbirlarda ishtirok eting va mahalla hisobotlarini baholang.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 motion-safe:animate-[fadeInUp_0.8s_ease-out]">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-300 bg-white/90 px-6 py-2.5 text-sm font-medium text-emerald-700 shadow-sm hover:bg-emerald-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-transform transition-shadow duration-200"
                  >
                    Kirish
                  </Link>
                </div>
              </div>

              {/* Right: info card */}
              <div className="hidden md:block">
                <div className="relative max-w-md ml-auto">
                  <div className="absolute -inset-4 rounded-3xl bg-[radial-gradient(circle_at_top,#22c55e55,transparent_60%),radial-gradient(circle_at_bottom,#0ea5e955,transparent_60%)] opacity-70 blur-3xl" />
                  <div className="relative rounded-2xl border border-emerald-100 bg-white/90 shadow-2xl backdrop-blur-md p-5">
                    <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-1.5 w-5 items-center justify-between">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        </span>
                        MMBP kirish oynasi (demo)
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-700">
                        Demo
                      </span>
                    </div>

                    <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <div className="space-y-1 text-xs text-emerald-800">
                        <p className="font-semibold">Mahalla foydalanuvchisi</p>
                        <p>
                          Login:{" "}
                          <span className="font-mono text-[11px] text-emerald-900">
                            example@mahalla.uz
                          </span>
                        </p>
                        <p>
                          Parol: <span className="font-mono text-[11px] text-emerald-900">********</span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/80 p-3 text-[11px] text-slate-600">
                        <p className="font-semibold mb-1 text-slate-900">Tizim imkoniyatlari:</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-4">
                          <li>Murojaatlarni qabul qilish va ko‘rib chiqish</li>
                          <li>Mahalla tadbirlarini rejalashtirish</li>
                          <li>Hisobotlar va statistikalar</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
            Platforma imkoniyatlari
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base">
            Mahalla bilan raqamli aloqa uchun barcha kerakli vositalar
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-xl border border-emerald-100 bg-white/90 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-200"
            >
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105 group-hover:bg-emerald-100">
                <f.icon className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600" />
              </div>
              <h3 className="font-heading font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-emerald-950 py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-3 text-white">
            Qanday ishlaydi?
          </h2>
          <p className="text-center text-sm md:text-base text-emerald-100 mb-10 max-w-2xl mx-auto">
            Uchta oddiy qadam orqali fuqarolar va mahalla o‘rtasidagi muloqotni raqamlashtiring.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "1", title: "Ro'yxatdan o'ting", desc: "Telefon raqamingiz orqali hisob yarating" },
              { step: "2", title: "Mahallani tanlang", desc: "O'z mahallangizni ro'yxatdan toping" },
              { step: "3", title: "Faol bo'ling", desc: "Shikoyat yuboring, tadbirlarda qatnashing" },
            ].map((s) => (
              <div key={s.step} className="text-center text-emerald-50">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-700/40 transition-transform duration-200 hover:-translate-y-0.5">
                  <span className="text-white font-heading font-bold">{s.step}</span>
                </div>
                <h3 className="font-heading font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-emerald-100/90">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-950 py-8">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 text-center text-sm text-slate-400">
          <p>© 2026 MMBP — Mahalla Monitoring va Boshqaruv Platformasi</p>
        </div>
      </footer>
    </div>
  );
}


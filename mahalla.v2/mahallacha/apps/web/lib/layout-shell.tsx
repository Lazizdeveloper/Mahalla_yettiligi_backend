"use client";

import type { ReactNode } from "react";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
}

interface LayoutShellProps {
  appTitle: string;
  navItems: NavItem[];
  children: ReactNode;
  theme?: "light" | "dark";
  contentClassName?: string;
}

const SidebarContent: React.FC<{
  appTitle: string;
  navItems: NavItem[];
  pathname: string;
  isDark: boolean;
  isResident: boolean;
  onNavClick?: () => void;
}> = ({ appTitle, navItems, pathname, isDark, isResident, onNavClick }) => (
  <>
    <div
      className={`px-4 py-4 border-b flex items-center justify-between ${
        isResident ? "border-white/10" : isDark ? "border-slate-800" : "border-slate-200"
      } ${isResident ? "text-white" : ""}`}
    >
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{appTitle}</h1>
        <p
          className={`mt-1 text-[11px] uppercase tracking-wide ${
            isResident ? "text-slate-300" : isDark ? "text-slate-400" : "text-gray-500"
          }`}
        >
          {isResident ? "Mening mahallam" : "Management Console"}
        </p>
      </div>
    </div>
    <nav
      className="flex-1 p-2 space-y-1 text-sm overflow-y-auto"
      {...(isResident && { "data-resident-nav": "" })}
    >
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            {...(isResident && active && { "data-nav-active": "" })}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all duration-200 ${isResident ? "relative" : ""} ${
              active
                ? isResident
                  ? "bg-violet-500/80 text-white shadow-lg shadow-violet-500/30"
                  : isDark
                    ? "bg-sky-600 text-white"
                    : "bg-slate-900 text-slate-50"
                : isResident
                  ? "text-slate-200 hover:bg-white/10 hover:text-white hover:-translate-y-px"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-800 hover:text-slate-50 hover:-translate-y-px hover:shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:-translate-y-px hover:shadow-sm"
            }`}
          >
            <span>{item.label}</span>
            {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </Link>
        );
      })}
    </nav>
    <div
      className={`px-4 py-3 border-t text-[11px] shrink-0 ${
        isResident
          ? "border-white/10 text-slate-400"
          : isDark
            ? "border-slate-800 text-slate-400"
            : "border-slate-200 text-gray-500"
      }`}
    >
      {`MMBP v1 | ${appTitle}`}
    </div>
  </>
);

export const LayoutShell: React.FC<LayoutShellProps> = ({
  appTitle,
  navItems,
  children,
  theme = "light",
  contentClassName
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const isDark = theme === "dark";
  const isResident = appTitle === "Aholi";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mmbp.auth.accessToken");
      localStorage.removeItem("mmbp.auth.refreshToken");
      localStorage.removeItem("mmbp.auth.user");
      localStorage.removeItem("mmbp.auth.panel");
    }

    setMobileMenuOpen(false);
    router.replace("/login");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const asideClass = `w-60 sm:w-64 border-r flex flex-col shrink-0 ${
    isResident
      ? "bg-white/5 border-white/10 shadow-2xl backdrop-blur-2xl text-white"
      : isDark
        ? "bg-slate-900 border-slate-800"
        : "bg-white border-slate-200"
  }`;

  return (
    <div
      className={`min-h-screen w-full flex flex-1 min-w-0 ${
        isDark
          ? "bg-slate-950 text-slate-50"
          : isResident
            ? "bg-transparent text-slate-900"
            : "bg-slate-100 text-slate-900"
      }`}
    >
      <aside className={`hidden lg:flex ${asideClass}`}>
        <SidebarContent
          appTitle={appTitle}
          navItems={navItems}
          pathname={pathname}
          isDark={isDark}
          isResident={isResident}
        />
      </aside>

      <div
        role="button"
        tabIndex={0}
        aria-label="Yopish"
        onClick={() => setMobileMenuOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setMobileMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] flex flex-col transform transition-transform duration-300 ease-out lg:hidden ${
          isResident
            ? "bg-slate-900/95 border-r border-white/10 shadow-2xl backdrop-blur-2xl text-white"
            : isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarContent
          appTitle={appTitle}
          navItems={navItems}
          pathname={pathname}
          isDark={isDark}
          isResident={isResident}
          onNavClick={() => setMobileMenuOpen(false)}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`h-12 sm:h-14 border-b flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 shrink-0 ${
            isResident
              ? "bg-white/5 border-white/10 text-white backdrop-blur-2xl"
              : isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Menyuni ochish"
              className={`lg:hidden p-2 -ml-2 rounded-lg focus:outline-none focus:ring-2 ${
                isResident
                  ? "hover:bg-white/10 focus:ring-violet-400/50 text-white"
                  : "hover:bg-slate-200/50 focus:ring-teal-400/50"
              }`}
            >
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden sm:block flex-1 max-w-xs lg:max-w-md min-w-0">
              <input
                type="text"
                placeholder="Qidirish..."
                className={`w-full rounded-lg border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 min-w-0 ${
                  isResident
                    ? "border-white/20 bg-white/10 text-white placeholder-slate-400 focus:ring-violet-400/50 focus:border-violet-400/50 backdrop-blur-sm"
                    : isDark
                      ? "border-slate-700 bg-slate-800 text-slate-50 placeholder-slate-500 focus:ring-sky-500/40 focus:border-sky-500"
                      : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:ring-slate-900/5 focus:border-slate-400"
                }`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                isResident
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : isDark
                    ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Logout
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right leading-tight">
                <p
                  className={
                    isResident
                      ? "text-xs font-medium text-slate-200"
                      : isDark
                        ? "text-xs font-medium text-slate-200"
                        : "text-xs font-medium"
                  }
                >
                  {appTitle}
                </p>
                <p
                  className={
                    isResident
                      ? "text-[10px] text-slate-400"
                      : isDark
                        ? "text-[10px] text-slate-400"
                        : "text-[10px] text-gray-500"
                  }
                >
                  MMBP tizimi
                </p>
              </div>
            </div>
            <div
              className={`h-8 w-8 rounded-full text-xs flex items-center justify-center font-semibold shrink-0 ${
                isResident
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                  : isDark
                    ? "bg-sky-600 text-white"
                    : "bg-slate-900 text-white"
              }`}
            >
              {isDark ? "H" : appTitle.charAt(0)}
            </div>
          </div>
        </header>

        <main
          {...(isResident && { "data-resident-scroll": "true" })}
          className={
            contentClassName
              ? `${contentClassName} w-full min-w-0`
              : `flex-1 overflow-auto min-h-0 w-full min-w-0 ${isDark ? "bg-slate-950" : "bg-slate-50 dark:bg-white"}`
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};

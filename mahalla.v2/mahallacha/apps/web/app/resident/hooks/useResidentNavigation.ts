"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const ROUTE_ORDER = [
  "/resident",
  "/resident/dashboard",
  "/resident/complaints",
  "/resident/reports",
  "/resident/events"
];

const SCROLL_KEY = "resident-scroll";

function getRouteIndex(path: string): number {
  const idx = ROUTE_ORDER.indexOf(path);
  return idx >= 0 ? idx : 0;
}

function getScrollContainer(): HTMLElement | null {
  return document.querySelector("[data-resident-scroll]");
}

function saveScroll(path: string, top: number) {
  try {
    const data = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
    data[path] = top;
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadScroll(path: string): number {
  try {
    const data = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
    return typeof data[path] === "number" ? data[path] : 0;
  } catch {
    return 0;
  }
}

export function useResidentNavigation() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // Direction: sync during render so AnimatePresence gets correct value
  const direction =
    prevPathRef.current !== pathname
      ? getRouteIndex(pathname) >= getRouteIndex(prevPathRef.current)
        ? 1
        : -1
      : 1;

  useEffect(() => {
    const prev = prevPathRef.current;
    if (prev !== pathname) {
      const el = getScrollContainer();
      if (el) saveScroll(prev, el.scrollTop);
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return { direction, pathname };
}

export function useResidentScrollRestore(pathname: string) {
  useEffect(() => {
    const top = loadScroll(pathname);
    if (top <= 0) return;

    const el = getScrollContainer();
    if (!el) return;

    const id = setTimeout(() => {
      el.scrollTop = top;
    }, 100);
    return () => clearTimeout(id);
  }, [pathname]);
}

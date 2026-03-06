"use client";

import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Hokimiyat paneliga xush kelibsiz</h1>
      <p className="text-gray-700">
        Davom etish uchun iltimos{" "}
        <Link href="/login" className="text-blue-600 underline">
          login
        </Link>{" "}
        qiling.
      </p>
    </main>
  );
}


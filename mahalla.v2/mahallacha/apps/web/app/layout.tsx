import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap"
});

export const metadata = {
  title: "MMBP",
  description: "Mahalla Monitoring va Boshqaruv Platformasi — yagona web ilova"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}


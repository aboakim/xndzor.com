import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Noto_Sans,
  Noto_Sans_Armenian,
  Noto_Serif,
  Noto_Serif_Armenian,
} from "next/font/google";
import "./globals.css";

const displayHy = Noto_Serif_Armenian({
  subsets: ["armenian"],
  variable: "--font-display-hy",
  weight: ["400", "700"],
});

const displayLat = Noto_Serif({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const sansHy = Noto_Sans_Armenian({
  subsets: ["armenian"],
  variable: "--font-sans-hy",
  weight: ["400", "500", "600", "700"],
});

const sans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FarmOS Armenia — Գյուղատնտես",
  description:
    "Farm operating system for Armenia — plots, today tasks, yield forecast, pre-sell harvest. Market modules secondary.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${displayHy.variable} ${displayLat.variable} ${sansHy.variable} ${sans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}

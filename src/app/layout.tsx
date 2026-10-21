import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider, { ThemeScript } from "@/components/ThemeProvider";

/* ── Fonts ───────────────────────────────────────────────── */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* ── Metadata ────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: "Horizon Portal · Aura Workforce by Growmar",
    template: "%s · Horizon Portal",
  },
  description:
    "Horizon Portal is the centralized workforce management platform for Aura Workforce by Growmar, built on the Horizon Design System.",
  keywords: ["workforce", "HR", "employee directory", "Growmar", "Aura"],
  authors: [{ name: "Growmar Engineering" }],
  openGraph: {
    title: "Horizon Portal · Aura Workforce by Growmar",
    description: "Centralized workforce management platform.",
    type: "website",
  },
};

/* ── Root Layout ─────────────────────────────────────────── */

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        {/* Inject theme script before React hydrates to prevent flash */}
        <ThemeScript />
      </head>
      <body className="min-h-dvh flex flex-col antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

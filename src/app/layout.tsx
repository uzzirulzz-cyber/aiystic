import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Mystic AI — Five-Engine AI Workspace",
  description:
    "A unified AI workspace coordinating Claude, Gemini, GLM, Codex, and Research agents on the same task. Plan, execute, verify, and deliver from one instruction.",
  keywords: ["Mystic AI", "Multi-agent", "Claude", "Gemini", "GLM", "Codex", "AI workspace"],
  authors: [{ name: "Playbeat Digital" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} antialiased bg-background text-foreground min-h-screen`}
        style={{ fontFamily: "var(--font-manrope), var(--font-geist-sans), sans-serif" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}


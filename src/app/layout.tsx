import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { PageTransition } from "@/components/ui/PageTransition";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RICCILAB",
  description: "Experiments in code, systems, and interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-bg text-black font-[family-name:var(--font-sans)]">
        <CustomCursor />
        <PageTransition />
        {children}
      </body>
    </html>
  );
}

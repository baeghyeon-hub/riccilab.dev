import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { PageTransition } from "@/components/ui/PageTransition";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { ScrollHUD } from "@/components/ui/ScrollHUD";
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
    <html lang="ko" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-black font-[family-name:var(--font-sans)] transition-colors duration-500">
        <LenisProvider>
          <CustomCursor />
          <ScrollHUD />
          <PageTransition />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}

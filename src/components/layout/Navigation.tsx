"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-bg/80 backdrop-blur-sm transition-colors duration-500">
      <Link
        href="/"
        className="text-black text-sm font-medium tracking-[0.08em] uppercase hover:text-muted transition-colors"
      >
        RICCILAB
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm transition-colors ${
              pathname === item.href ? "text-black" : "text-muted hover:text-black"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <div className="w-px h-4 bg-border" />
        <ThemeToggle />
      </nav>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden flex flex-col gap-1.5 w-6 h-6 justify-center"
        aria-label="Toggle menu"
      >
        <span className={`block h-px w-full bg-black transition-all duration-300 ${open ? "rotate-45 translate-y-[3.5px]" : ""}`} />
        <span className={`block h-px w-full bg-black transition-all duration-300 ${open ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 w-full bg-bg/95 backdrop-blur-md border-b border-border md:hidden">
          <nav className="flex flex-col px-6 py-6 gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`text-lg font-medium transition-colors ${
                  pathname === item.href ? "text-black" : "text-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

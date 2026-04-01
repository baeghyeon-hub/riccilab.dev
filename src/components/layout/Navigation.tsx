"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-bg/80 backdrop-blur-sm">
      <Link
        href="/"
        className="text-black text-sm font-medium tracking-[0.08em] uppercase hover:text-muted transition-colors"
      >
        RICCILAB
      </Link>

      <nav className="flex gap-8">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm transition-colors ${
              pathname === item.href
                ? "text-black"
                : "text-muted hover:text-black"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

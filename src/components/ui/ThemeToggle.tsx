"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  if (!mounted) {
    return <div className="w-[88px] h-[24px] inline-block" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="font-mono text-[11px] tracking-wider text-muted hover:text-black transition-colors px-2 py-1 select-none"
    >
      [MODE: {isDark ? "DARK" : "LIGHT"}]
    </button>
  );
}

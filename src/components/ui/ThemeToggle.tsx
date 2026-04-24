"use client";

import { triggerThemeGlitch } from "@/components/ui/ThemeGlitchFilter";
import {
  getNextThemeMode,
  themeModeFromClassName,
  useClientMounted,
  useDocumentThemeMode,
} from "@/lib/client-ui-state";

export function ThemeToggle() {
  const mounted = useClientMounted();
  const themeMode = useDocumentThemeMode();

  const toggleTheme = () => {
    triggerThemeGlitch(() => {
      const currentMode = themeModeFromClassName(
        document.documentElement.className
      );
      const nextMode = getNextThemeMode(currentMode);

      if (nextMode === "light") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      }
    });
  };

  if (!mounted) {
    return <div className="w-[88px] h-[24px] inline-block" />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="font-mono text-[11px] tracking-wider text-muted hover:text-black transition-colors px-2 py-1 select-none"
    >
      [MODE: {themeMode === "dark" ? "DARK" : "LIGHT"}]
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

export function ScrollHUD() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;
    let lastValue = -1;

    const update = () => {
      rafId = 0;
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = windowHeight === 0
        ? 0
        : Math.min(100, Math.max(0, Math.floor((totalScroll / windowHeight) * 100)));

      if (scroll !== lastValue) {
        lastValue = scroll;
        setScrollProgress(scroll);
      }
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed right-6 bottom-6 md:right-12 md:bottom-12 z-40 pointer-events-none mix-blend-difference hidden md:block">
      <div className="flex flex-col items-end gap-3 text-white opacity-60">
        <span className="font-mono text-[10px] tracking-[0.2em] whitespace-nowrap">
          DEPTH_ {String(scrollProgress).padStart(3, "0")}%
        </span>
        <div className="w-[1px] h-32 bg-white/20 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 w-full bg-white transition-all duration-100 ease-out"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

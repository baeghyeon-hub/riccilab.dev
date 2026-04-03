"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    let currentReq: number;
    let running = false;

    function raf(time: number) {
      lenis.raf(time);
      currentReq = requestAnimationFrame(raf);
    }

    function startLoop() {
      if (!running) {
        running = true;
        currentReq = requestAnimationFrame(raf);
      }
    }

    function stopLoop() {
      running = false;
      cancelAnimationFrame(currentReq);
    }

    const handleVisibility = () => {
      document.hidden ? stopLoop() : startLoop();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    startLoop();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopLoop();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

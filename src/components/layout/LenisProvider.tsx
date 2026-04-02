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
    function raf(time: number) {
      lenis.raf(time);
      currentReq = requestAnimationFrame(raf);
    }

    currentReq = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(currentReq);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

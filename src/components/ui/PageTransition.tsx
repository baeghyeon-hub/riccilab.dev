"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "@/lib/gsap";

const GRID_COLS = 12;
const GRID_ROWS = 8;
const TERMINAL_LINES = [
  "> LOADING MODULE...",
  "> DECRYPTING SIGNAL",
  "> RENDER::INIT",
  "> STREAM OK",
  "> READY",
];

export function PageTransition() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isAnimating = useRef(false);
  const prevPath = useRef(pathname);

  // Play entry animation (pixels unreveal + terminal type)
  const playEntry = useCallback(() => {
    const overlay = overlayRef.current;
    const terminal = terminalRef.current;
    if (!overlay || !terminal) return;

    const cells = overlay.querySelectorAll("[data-cell]");
    const lines = terminal.querySelectorAll("[data-line]");

    // Terminal typing
    gsap.set(terminal, { display: "block", opacity: 1 });
    lines.forEach((line, i) => {
      const el = line as HTMLElement;
      gsap.fromTo(
        el,
        { opacity: 0, x: -8 },
        {
          opacity: 1, x: 0,
          duration: 0.15,
          delay: 0.05 + i * 0.08,
          ease: "power2.out",
        }
      );
    });

    // Pixels scatter away
    gsap.to(cells, {
      opacity: 0,
      scale: 0.5,
      duration: 0.3,
      stagger: { amount: 0.4, from: "random" },
      ease: "power2.in",
      delay: 0.3,
    });

    // Fade terminal + hide overlay
    gsap.to(terminal, {
      opacity: 0, delay: 0.7, duration: 0.2,
      onComplete: () => {
        gsap.set(overlay, { display: "none" });
        gsap.set(terminal, { display: "none" });
        isAnimating.current = false;
      },
    });
  }, []);

  // Play exit animation (pixels cover screen)
  const playExit = useCallback((href: string) => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const cells = overlay.querySelectorAll("[data-cell]");

    gsap.set(overlay, { display: "grid" });
    gsap.set(cells, { opacity: 0, scale: 1.5 });

    gsap.to(cells, {
      opacity: 1,
      scale: 1,
      duration: 0.25,
      stagger: { amount: 0.35, from: "random" },
      ease: "power2.out",
      onComplete: () => {
        router.push(href);
      },
    });
  }, [router]);

  // On pathname change, play entry
  useEffect(() => {
    if (prevPath.current !== pathname && isAnimating.current) {
      prevPath.current = pathname;
      playEntry();
    } else {
      prevPath.current = pathname;
    }
  }, [pathname, playEntry]);

  // Intercept link clicks globally
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return;
      if (href === pathname) return;

      // Skip transition for same-pathname navigations (query param changes only)
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === pathname) return;
      } catch {}


      e.preventDefault();
      playExit(href);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, playExit]);

  return (
    <>
      {/* Pixel grid overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[90] pointer-events-none hidden"
        style={{
          display: "none",
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
          <div
            key={i}
            data-cell
            className="bg-black opacity-0"
          />
        ))}
      </div>

      {/* Terminal text overlay */}
      <div
        ref={terminalRef}
        className="fixed inset-0 z-[91] pointer-events-none hidden flex items-center justify-center"
        style={{ display: "none" }}
      >
        <div className="font-mono text-xs tracking-wider text-white/80 space-y-1.5">
          {TERMINAL_LINES.map((line, i) => (
            <div key={i} data-line className="opacity-0">
              {line}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

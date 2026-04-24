"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const FLOATING_DATA = [
  "LAT: 37.5665",
  "LONG: 126.9780",
  "δx/δt = αΔu",
  "∇²ψ = 0",
  "λ = 632.8nm",
  "f(x) → ∞",
  "NODE_03::ACTIVE",
  "FREQ: 440Hz",
  "Δt = 0.016s",
  "RX: 0xA3F2",
  "SIGNAL::OK",
  "η = 0.9973",
];

export function LabBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const subGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll("[data-float]");
    const tl = gsap.timeline();

    const ctx = gsap.context(() => {
      // Grid pulse animation
      if (gridRef.current) {
        tl.add(gsap.fromTo(
          gridRef.current,
          { opacity: 0.05 },
          { opacity: 0.15, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" }
        ), 0);
      }
      if (subGridRef.current) {
        tl.add(gsap.fromTo(
          subGridRef.current,
          { opacity: 0.03 },
          { opacity: 0.08, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.5 }
        ), 0);
      }

      items.forEach((item, i) => {
        // Random starting position
        gsap.set(item, {
          x: Math.random() * 200 - 100,
          y: Math.random() * 100 - 50,
        });

        // Slow drift animation
        tl.add(gsap.to(item, {
          x: `+=${Math.random() * 60 - 30}`,
          y: `+=${Math.random() * 40 - 20}`,
          duration: 8 + Math.random() * 12,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        }), 0);

        // Pulse: fade between light and dark
        const isDark = document.documentElement.classList.contains("dark");
        const lo = isDark ? "rgba(240,240,240,0.1)" : "rgba(0,0,0,0.1)";
        const hi = isDark ? "rgba(240,240,240,0.4)" : "rgba(0,0,0,0.4)";
        tl.add(gsap.fromTo(
          item,
          { color: lo },
          {
            color: hi,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.8,
          }
        ), 0);
      });
    }, container);

    const handleVisibility = () => {
      if (document.hidden) {
        tl.pause();
      } else {
        tl.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      ctx.revert();
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Grid paper pattern — pulsing */}
      <div
        ref={gridRef}
        className="absolute inset-0"
        style={{
          opacity: 0.06,
          backgroundImage:
            "linear-gradient(var(--black) 1px, transparent 1px), linear-gradient(90deg, var(--black) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Finer sub-grid — pulsing offset */}
      <div
        ref={subGridRef}
        className="absolute inset-0"
        style={{
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(var(--black) 0.5px, transparent 0.5px), linear-gradient(90deg, var(--black) 0.5px, transparent 0.5px)",
          backgroundSize: "15px 15px",
        }}
      />

      {/* Floating data elements */}
      <div ref={containerRef} className="absolute inset-0">
        {FLOATING_DATA.map((text, i) => (
          <span
            key={i}
            data-float
            className={`absolute font-mono text-[10px] tracking-[0.15em] text-black/40 select-none ${i >= 6 ? "hidden md:block" : ""}`}
            style={{
              top: `${8 + (i * 7.5) % 85}%`,
              left: `${5 + ((i * 17 + 13) % 90)}%`,
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

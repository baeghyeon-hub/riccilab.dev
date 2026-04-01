"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const GLITCH_CHARS = "!@#$%&_░▒▓█▀▄?><";

export function GlitchTitle({ text, className = "" }: { text: string; className?: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const original = text;

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    // Entrance: glitch decode effect
    let frame = 0;
    const totalFrames = 20;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const decoded = original
        .split("")
        .map((ch, i) => {
          if (ch === " ") return ch;
          return i / original.length < progress
            ? ch
            : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        })
        .join("");
      el.textContent = decoded;

      if (frame >= totalFrames) {
        clearInterval(interval);
        el.textContent = original;
      }
    }, 50);

    // Subtle entrance animation
    gsap.fromTo(
      el,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    // Periodic micro-glitch
    const glitchLoop = setInterval(() => {
      const glitched = original
        .split("")
        .map((ch) => {
          if (ch === " ") return ch;
          return Math.random() < 0.08
            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            : ch;
        })
        .join("");
      el.textContent = glitched;
      setTimeout(() => {
        el.textContent = original;
      }, 80);
    }, 4000 + Math.random() * 3000);

    return () => {
      clearInterval(interval);
      clearInterval(glitchLoop);
    };
  }, [original]);

  return (
    <h1
      ref={titleRef}
      className={`text-6xl md:text-8xl lg:text-9xl font-black text-black tracking-tighter leading-none ${className}`}
    >
      {text}
    </h1>
  );
}

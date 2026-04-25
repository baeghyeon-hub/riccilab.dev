"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { scrambleReveal, scrambleText } from "@/lib/glitch-text";

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
      el.textContent = scrambleReveal(original, progress, GLITCH_CHARS);

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
      el.textContent = scrambleText(original, 0.08, GLITCH_CHARS);
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

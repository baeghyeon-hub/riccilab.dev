"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

const GLITCH_CHARS = "!@#$%&_░▒▓█▀▄";

function glitchNumber(n: number, intensity: number): string {
  const str = String(n).padStart(3, "0");
  if (intensity < 0.05) return str;

  return str
    .split("")
    .map((ch) =>
      Math.random() < intensity
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : ch
    )
    .join("");
}

export function Loader({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState("000");

  useEffect(() => {
    const obj = { val: 0 };

    const tl = gsap.timeline();

    // Phase 1a: 0→70 fast
    tl.to(obj, {
      val: 70,
      duration: 1.2,
      ease: "power1.in",
      onUpdate: () => {
        const v = Math.round(obj.val);
        const intensity = v > 40 ? 0.06 : 0;
        setDisplay(glitchNumber(v, intensity));
      },
    });

    // Phase 1b: 70→90 slower
    tl.to(obj, {
      val: 90,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        const v = Math.round(obj.val);
        const intensity = (v - 70) / 50;
        setDisplay(glitchNumber(v, intensity));
      },
    });

    // Phase 1c: 90→100 slowest + tension
    tl.to(obj, {
      val: 100,
      duration: 1.0,
      ease: "power3.out",
      onUpdate: () => {
        const v = Math.round(obj.val);
        const intensity = (v - 70) / 40;
        setDisplay(glitchNumber(v, intensity));
      },
    });

    // Shake the counter at higher counts
    tl.to(
      counterRef.current,
      {
        x: "random(-3, 3)",
        y: "random(-2, 2)",
        duration: 0.05,
        repeat: 20,
        yoyo: true,
        ease: "none",
      },
      1.4
    );

    // Hold at 100 for tension
    tl.to({}, { duration: 0.5 });

    // Phase 2: Counter fades out
    tl.to(counterRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.in",
    });

    // Phase 3: RICCI / LAB appears with subtle blur + fade
    tl.set(titleRef.current, { display: "flex" });

    tl.fromTo(
      line1Ref.current,
      { y: 10, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }
    );

    tl.fromTo(
      line2Ref.current,
      { y: 10, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.7, ease: "power3.out" },
      "-=0.45"
    );

    // Hold for a beat
    tl.to({}, { duration: 0.4 });

    // Phase 4: Invert — black bg becomes white, text becomes black, then slide up
    tl.to(containerRef.current, {
      backgroundColor: "#ffffff",
      duration: 0.4,
      ease: "power2.inOut",
    });

    tl.to(
      [line1Ref.current, line2Ref.current],
      {
        color: "#111111",
        duration: 0.4,
        ease: "power2.inOut",
      },
      "<"
    );

    // Slide entire loader up to reveal page
    tl.to(containerRef.current, {
      yPercent: -100,
      duration: 0.7,
      ease: "power3.inOut",
      delay: 0.15,
      onComplete,
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      {/* Counter */}
      <div
        ref={counterRef}
        className="text-center"
      >
        <span className="text-[clamp(5.5rem,20vw,7rem)] md:text-[10rem] font-extralight tracking-tight text-white leading-none font-mono">
          {display}
        </span>
      </div>

      {/* Fullscreen title (hidden initially) */}
      <div
        ref={titleRef}
        className="absolute inset-0 hidden flex-col items-center justify-center gap-0"
      >
        <div className="overflow-hidden">
          <div
            ref={line1Ref}
            className="text-[clamp(4rem,15vw,14rem)] font-black text-white leading-[0.9] tracking-tighter"
          >
            RICCI
          </div>
        </div>
        <div className="overflow-hidden">
          <div
            ref={line2Ref}
            className="text-[clamp(4rem,15vw,14rem)] font-black text-white leading-[0.9] tracking-tighter"
          >
            LAB
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const GLITCH_CHARS = "!@#$%&_░▒▓█▀▄?><";

// Desktop: absolute right, mouse-reactive
function DesktopReactiveTitle() {
  const hitRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const originalText = "RICCI\nLAB";

  useEffect(() => {
    const hitArea = hitRef.current;
    const textEl = textRef.current;
    if (!hitArea || !textEl) return;

    const xTo = gsap.quickTo(textEl, "x", { duration: 0.8, ease: "power3.out" });
    const yTo = gsap.quickTo(textEl, "y", { duration: 0.8, ease: "power3.out" });
    const rotTo = gsap.quickTo(textEl, "rotation", { duration: 1.0, ease: "power3.out" });
    const skewTo = gsap.quickTo(textEl, "skewX", { duration: 0.9, ease: "power3.out" });

    let glitchInterval: ReturnType<typeof setInterval> | null = null;
    let currentDist = 0;

    const handleEnter = () => {
      gsap.to(textEl, { scale: 1.02, duration: 0.5, ease: "power2.out" });
    };

    const handleMove = (e: MouseEvent) => {
      const rect = hitArea.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      xTo(dx * 18); yTo(dy * 12); rotTo(dx * 2); skewTo(dx * 3);
      currentDist = Math.sqrt(dx * dx + dy * dy);

      if (!glitchInterval) {
        glitchInterval = setInterval(() => {
          if (currentDist > 0.25) {
            const intensity = Math.min((currentDist - 0.25) * 0.8, 0.3);
            textEl.textContent = originalText.split("").map((ch) =>
              ch === "\n" ? ch : Math.random() < intensity
                ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : ch
            ).join("");
          } else {
            textEl.textContent = originalText;
          }
        }, 120);
      }
    };

    const handleLeave = () => {
      xTo(0); yTo(0); rotTo(0); skewTo(0);
      if (glitchInterval) { clearInterval(glitchInterval); glitchInterval = null; }
      gsap.to(textEl, { scale: 1, duration: 0.5, ease: "power2.out" });
      textEl.textContent = originalText;
    };

    hitArea.addEventListener("mouseenter", handleEnter);
    hitArea.addEventListener("mousemove", handleMove);
    hitArea.addEventListener("mouseleave", handleLeave);

    return () => {
      hitArea.removeEventListener("mouseenter", handleEnter);
      hitArea.removeEventListener("mousemove", handleMove);
      hitArea.removeEventListener("mouseleave", handleLeave);
      if (glitchInterval) clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="hidden md:flex absolute inset-y-0 right-0 w-[50%] items-center justify-end pr-16 lg:pr-24 pointer-events-none">
      <div ref={hitRef} className="relative cursor-crosshair pointer-events-auto">
        <div ref={textRef} className="text-[clamp(4rem,12vw,11rem)] font-black text-black leading-[0.85] tracking-tighter select-none whitespace-pre will-change-transform">
          {`RICCI\nLAB`}
        </div>
      </div>
    </div>
  );
}

// Mobile: top positioned, tap to glitch
function MobileTitle() {
  const textRef = useRef<HTMLDivElement>(null);
  const originalText = "RICCILAB";

  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;

    const doGlitch = () => {
      // 3-frame glitch burst
      const scramble = () => originalText.split("").map((ch) =>
        Math.random() < 0.4 ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : ch
      ).join("");

      textEl.textContent = scramble();
      gsap.to(textEl, { x: Math.random() * 6 - 3, skewX: Math.random() * 4 - 2, duration: 0.05 });

      setTimeout(() => {
        textEl.textContent = scramble();
        gsap.to(textEl, { x: Math.random() * 4 - 2, skewX: Math.random() * 3 - 1.5, duration: 0.05 });
      }, 60);

      setTimeout(() => {
        textEl.textContent = originalText;
        gsap.to(textEl, { x: 0, skewX: 0, duration: 0.2, ease: "power2.out" });
      }, 130);
    };

    const handleTouch = () => doGlitch();
    textEl.addEventListener("touchstart", handleTouch, { passive: true });

    // Also do a periodic subtle glitch
    const interval = setInterval(doGlitch, 4000 + Math.random() * 3000);

    return () => {
      textEl.removeEventListener("touchstart", handleTouch);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="md:hidden mb-6" data-mobile-title>
      <div
        ref={textRef}
        className="text-[3.5rem] font-black text-black leading-none tracking-tighter select-none will-change-transform"
      >
        RICCILAB
      </div>
    </div>
  );
}

const FORMULA_PLAIN = "Rμν = Rλμλν";
const FORMULA_GLITCH_CHARS = "░▒▓█▀▄!@#∑∂∇Δ∫";

function RicciFormula() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glitch1Ref = useRef<HTMLDivElement>(null);
  const glitch2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const g1 = glitch1Ref.current;
    const g2 = glitch2Ref.current;
    if (!g1 || !g2) return;

    const scramble = (intensity: number) =>
      FORMULA_PLAIN.split("").map((ch) =>
        ch === " " ? ch
          : Math.random() < intensity
            ? FORMULA_GLITCH_CHARS[Math.floor(Math.random() * FORMULA_GLITCH_CHARS.length)]
            : ch
      ).join("");

    const doGlitch = () => {
      // Layer 1: offset left, color inverted
      g1.textContent = scramble(0.5);
      gsap.set(g1, { display: "block", opacity: 0.8, x: -8 - Math.random() * 10 });

      // Layer 2: offset right
      g2.textContent = scramble(0.4);
      gsap.set(g2, { display: "block", opacity: 0.6, x: 6 + Math.random() * 10 });

      setTimeout(() => {
        g1.textContent = scramble(0.6);
        gsap.set(g1, { x: 4 + Math.random() * 6 });
        g2.textContent = scramble(0.3);
        gsap.set(g2, { x: -3 - Math.random() * 5 });
      }, 40);

      setTimeout(() => {
        g1.textContent = scramble(0.7);
        gsap.set(g1, { x: -2 + Math.random() * 4 });
      }, 70);

      setTimeout(() => {
        gsap.set(g1, { display: "none", opacity: 0, x: 0 });
        gsap.set(g2, { display: "none", opacity: 0, x: 0 });
      }, 110);
    };

    const interval = setInterval(doGlitch, 1500 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={wrapRef} data-formula className="relative opacity-0">
      {/* Main — dot matrix style */}
      <div className="formula-dot text-2xl md:text-4xl font-black tracking-wider text-black">
        R<sub>μν</sub> <span className="text-muted">=</span> R<sup>λ</sup><sub>μλν</sub>
      </div>
      {/* Glitch layer 1 */}
      <div
        ref={glitch1Ref}
        className="absolute inset-0 formula-dot text-2xl md:text-4xl font-black tracking-wider text-white bg-black mix-blend-difference hidden opacity-0"
        aria-hidden
      />
      {/* Glitch layer 2 */}
      <div
        ref={glitch2Ref}
        className="absolute inset-0 formula-dot text-2xl md:text-4xl font-black tracking-wider text-black/50 hidden opacity-0"
        aria-hidden
      />
    </div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const formulaWrapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const visited = sessionStorage.getItem("riccilab-visited");
      const delay = visited ? 0.3 : 4.8;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay,
      });

      // Mobile title
      const mobileTitle = sectionRef.current?.querySelector("[data-mobile-title]");
      if (mobileTitle) {
        tl.fromTo(mobileTitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
      }

      // Bio text slides up
      tl.fromTo(
        bioRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        mobileTitle ? "-=0.3" : "+=0"
      );

      // Formula appears
      const formula = formulaWrapRef.current?.querySelector("[data-formula]");
      if (formula) {
        tl.fromTo(
          formula,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.3"
        );
      }

      // Scroll indicator fades in
      tl.fromTo(
        scrollRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4 },
        "-=0.1"
      );

      // Scroll indicator blink
      gsap.fromTo(
        scrollRef.current,
        { opacity: 1 },
        {
          opacity: 0.2,
          repeat: -1,
          yoyo: true,
          duration: 1.2,
          ease: "sine.inOut",
          delay: delay + 2,
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[92vh] flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20"
    >
      {/* Desktop: mouse-reactive on the right */}
      <DesktopReactiveTitle />

      <div className="relative z-10 max-w-[700px] w-full">
        {/* Mobile: tap-to-glitch title at top */}
        <MobileTitle />

        {/* Bio */}
        <div
          ref={bioRef}
          className="font-mono text-sm md:text-base text-black/60 max-w-md mb-8 opacity-0 space-y-1"
        >
          <p>&gt; Experiments in code, systems, and interfaces.</p>
          <p>&gt; Building digital experiences that feel intentional.</p>
        </div>

        {/* Ricci tensor formula */}
        <div ref={formulaWrapRef} className="border-t border-border py-5 md:py-6 border-b">
          <RicciFormula />
        </div>

        {/* Scroll prompt — with arrow + blink */}
        <div
          ref={scrollRef}
          className="mt-10 flex items-center gap-4 opacity-0"
        >
          <span className="text-xs tracking-[0.15em] text-muted uppercase">
            Scroll to explore
          </span>
          <div className="h-px w-10 bg-border" />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-muted"
          >
            <path
              d="M8 2v10m0 0l-4-4m4 4l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}

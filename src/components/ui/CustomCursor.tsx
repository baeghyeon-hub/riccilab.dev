"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Detect touch device
    const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouch(touch);
    if (touch) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const pixels = pixelsRef.current;
    if (!dot || !ring || !pixels) return;

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power2.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.25, ease: "power2.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.25, ease: "power2.out" });
    const pxX = gsap.quickTo(pixels, "x", { duration: 0.15, ease: "power2.out" });
    const pxY = gsap.quickTo(pixels, "y", { duration: 0.15, ease: "power2.out" });

    let isHovering = false;
    let isHidden = false;

    const handleMove = (e: MouseEvent) => {
      // Check if mouse is interacting with native scrollbar or left screen
      const isOverScrollbar = e.clientX >= document.documentElement.clientWidth;

      if (isOverScrollbar) {
        if (!isHidden) {
          gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
          isHidden = true;
        }
      } else {
        if (isHidden) {
          // ring starts with opacity 1, or 0 if hovering. We'll simplify and just fade to 1 unless hovering 
          gsap.to(dot, { opacity: 1, duration: 0.2 });
          gsap.to(ring, { opacity: isHovering ? 0 : 1, duration: 0.2 });
          isHidden = false;
        }
        dotX(e.clientX);
        dotY(e.clientY);
        ringX(e.clientX);
        ringY(e.clientY);
        pxX(e.clientX);
        pxY(e.clientY);
      }
    };

    const handleWindowLeave = () => {
      if (!isHidden) {
        gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
        isHidden = true;
      }
    };

    const handleWindowEnter = () => {
      if (isHidden) {
        gsap.to(dot, { opacity: 1, duration: 0.2 });
        gsap.to(ring, { opacity: isHovering ? 0 : 1, duration: 0.2 });
        isHidden = false;
      }
    };

    const handleEnterInteractive = () => {
      if (isHovering) return;
      isHovering = true;
      gsap.to(dot, { scale: 0, duration: 0.15 });
      gsap.to(ring, { scale: 1.6, opacity: 0, duration: 0.2 });
      gsap.to(pixels, { opacity: 1, duration: 0.1 });
      const pxItems = pixels.querySelectorAll("[data-px]");
      pxItems.forEach((px) => {
        gsap.to(px, { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, duration: 0.2, ease: "power2.out" });
      });
    };

    const handleLeaveInteractive = () => {
      if (!isHovering) return;
      isHovering = false;
      gsap.to(dot, { scale: 1, duration: 0.2 });
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.25 });
      gsap.to(pixels, { opacity: 0, duration: 0.15 });
      const pxItems = pixels.querySelectorAll("[data-px]");
      pxItems.forEach((px) => {
        gsap.to(px, { x: 0, y: 0, duration: 0.2 });
      });
    };

    const attachListeners = () => {
      const targets = document.querySelectorAll("a, button, [data-cursor-glitch]");
      targets.forEach((el) => {
        el.addEventListener("mouseenter", handleEnterInteractive);
        el.addEventListener("mouseleave", handleLeaveInteractive);
      });
      return targets;
    };

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleWindowLeave);
    document.addEventListener("mouseenter", handleWindowEnter);
    
    let targets = attachListeners();

    const observer = new MutationObserver(() => {
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnterInteractive);
        el.removeEventListener("mouseleave", handleLeaveInteractive);
      });
      targets = attachListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleWindowLeave);
      document.removeEventListener("mouseenter", handleWindowEnter);
      targets.forEach((el) => {
        el.removeEventListener("mouseenter", handleEnterInteractive);
        el.removeEventListener("mouseleave", handleLeaveInteractive);
      });
      observer.disconnect();
    };
  }, []);

  // Don't render anything on touch devices
  if (isTouch) return null;

  return (
    <>
      <style jsx global>{`
        @media (pointer: fine) {
          *, *::before, *::after { cursor: none !important; }
        }
      `}</style>

      <div ref={dotRef} className="fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <div className="w-2 h-2 bg-black rounded-full mix-blend-difference" />
      </div>
      <div ref={ringRef} className="fixed top-0 left-0 z-[9998] pointer-events-none -translate-x-1/2 -translate-y-1/2">
        <div className="w-8 h-8 border border-black/40 rounded-full mix-blend-difference" />
      </div>
      <div ref={pixelsRef} className="fixed top-0 left-0 z-[9999] pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} data-px className="absolute w-1.5 h-1.5 bg-black mix-blend-difference"
            style={{ top: `${Math.floor(i / 3) * 4 - 4}px`, left: `${(i % 3) * 4 - 4}px` }} />
        ))}
      </div>
    </>
  );
}

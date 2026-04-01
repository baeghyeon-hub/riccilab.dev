"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export function Marquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(trackRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 20,
        ease: "none",
      });
    }, trackRef);

    return () => ctx.revert();
  }, []);

  const text = "RICCILAB \u00a0\u00a0\u00a0 RICCILAB \u00a0\u00a0\u00a0 RICCILAB \u00a0\u00a0\u00a0 RICCILAB \u00a0\u00a0\u00a0 ";

  return (
    <div className="overflow-hidden py-8 md:py-12 border-t border-b border-border">
      <div ref={trackRef} className="flex whitespace-nowrap will-change-transform">
        <span className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-black tracking-tighter text-black leading-none uppercase">
          {text}
        </span>
        <span className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-black tracking-tighter text-black leading-none uppercase">
          {text}
        </span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const SOCIALS = [
  { label: "Github", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "LinkedIn", href: "#" },
] as const;

export function Footer() {
  const emailRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        emailRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: emailRef.current, start: "top 90%" },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <footer className="px-6 md:px-12 lg:px-20 py-20 md:py-32 border-t border-border">
      <div className="max-w-[1100px] w-full mx-auto">
        <p className="text-xs tracking-[0.2em] text-muted uppercase mb-8">
          Get in touch
        </p>
        <a
          ref={emailRef}
          href="mailto:hello@riccilab.dev"
          className="text-3xl md:text-5xl lg:text-6xl font-semibold text-black hover:text-muted transition-colors leading-tight inline-block"
        >
          hello@riccilab.dev
        </a>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-24 pt-6 border-t border-border">
          <span className="text-xs text-muted">
            &copy; {new Date().getFullYear()} RICCILAB
          </span>
          <div className="flex gap-6">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-xs text-muted hover:text-black transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

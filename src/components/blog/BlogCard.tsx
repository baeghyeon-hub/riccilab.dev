"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import type { BlogPost } from "@/lib/blog";

const GLITCH_CHARS = "!@#$%&_░▒▓█▀▄?><";

export function BlogCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const glitch = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    const original = post.title;

    const glitched = original
      .split("")
      .map((ch) =>
        ch === " " ? ch
          : Math.random() < 0.3
            ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            : ch
      )
      .join("");

    el.textContent = glitched;
    setTimeout(() => { el.textContent = original; }, 100);
  }, [post.title]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: cardRef.current, start: "top 90%" },
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <Link
      ref={cardRef}
      href={`/blog/${post.slug}`}
      onMouseEnter={glitch}
      className="group block border-b border-border py-8 md:py-10 opacity-0 hover:pl-4 transition-all duration-300"
    >
      {/* Date + Category + Index */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <span className="font-mono text-[11px] tracking-[0.15em] text-muted">
          {post.date}
        </span>
        {post.categoryName && (
          <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
            &gt; {post.categoryName.toUpperCase()}
          </span>
        )}
        <span className="font-mono text-[10px] text-muted">
          #{String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Title */}
      <h2
        ref={titleRef}
        className="text-xl md:text-2xl font-bold text-black tracking-tight mb-2 group-hover:text-muted transition-colors"
      >
        {post.title}
      </h2>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed mb-4 max-w-xl">
        {post.description}
      </p>

      {/* Terminal-style tags (static labels) */}
      <div className="flex flex-wrap gap-3">
        {post.tags.map((tag: string) => (
          <span
            key={tag}
            className="font-mono text-[11px] tracking-wider text-muted"
          >
            _{tag.toUpperCase()}
          </span>
        ))}
      </div>
    </Link>
  );
}

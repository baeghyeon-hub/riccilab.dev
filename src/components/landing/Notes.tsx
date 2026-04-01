"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

export function Notes({ posts }: { posts: BlogPost[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll("[data-card]");
      cards?.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, delay: i * 0.1,
            ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 90%" },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const display = posts.slice(0, 3);

  return (
    <section ref={sectionRef} className="px-6 md:px-12 lg:px-20 py-24 md:py-36">
      <div className="max-w-[1100px] w-full mx-auto">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="text-xs tracking-[0.2em] text-muted uppercase">
            Lab Notes
          </h2>
          <Link href="/blog" className="text-xs text-muted hover:text-black transition-colors">
            All posts &rarr;
          </Link>
        </div>

        {display.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {display.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                data-card
                className="group block border border-border p-6 hover:border-black/30 transition-colors"
              >
                <time className="text-xs text-muted">{post.date}</time>
                <h3 className="text-lg font-semibold text-black mt-3 mb-2 group-hover:text-muted transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted text-sm">Coming soon.</p>
        )}
      </div>
    </section>
  );
}

"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.5, delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: cardRef.current, start: "top 88%" },
        }
      );
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={cardRef}
      className="group relative border border-border p-7 md:p-9 opacity-0 hover:border-black/30 transition-all duration-300"
    >
      {/* Stretched link — covers entire card, routes to detail page */}
      <Link
        href={`/projects/${project.slug}`}
        aria-label={`${project.title} 상세 보기`}
        className="absolute inset-0 z-0"
      />

      {/* Top: category + index */}
      <div className="relative z-[1] flex items-center justify-between mb-6 pointer-events-none">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
          &gt; {project.categoryName || "UNCATEGORIZED"}
        </span>
        <span className="font-mono text-[10px] text-muted tracking-wider">
          [{String(index + 1).padStart(2, "0")}]
        </span>
      </div>

      {/* Title */}
      <h3 className="relative z-[1] text-xl md:text-2xl font-bold text-black tracking-tight mb-3 group-hover:translate-x-2 transition-transform duration-300 pointer-events-none">
        {project.title}
      </h3>

      {/* Description */}
      <p className="relative z-[1] text-sm text-muted leading-relaxed mb-6 pointer-events-none">
        {project.description}
      </p>

      {/* Tech stack — terminal style */}
      <div className="relative z-[1] flex flex-wrap gap-2 mb-6 pointer-events-none">
        {project.tech.map((t) => (
          <span
            key={t}
            className="font-mono text-[11px] tracking-wider text-muted"
          >
            _{t}
          </span>
        ))}
      </div>

      {/* Links — external, must sit above the stretched link */}
      {(project.link || project.github) && (
        <div className="relative z-10 flex gap-5 font-mono text-[11px] tracking-wider">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer noopener"
              onClick={stopPropagation}
              className="text-black hover:text-muted transition-colors"
            >
              DEMO &rarr;
            </a>
          )}
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noreferrer noopener"
              onClick={stopPropagation}
              className="text-muted hover:text-black transition-colors"
            >
              SOURCE
            </a>
          )}
        </div>
      )}

      {/* Hover line */}
      <div className="absolute bottom-0 left-0 w-0 h-px bg-black group-hover:w-full transition-all duration-500 pointer-events-none" />
    </div>
  );
}

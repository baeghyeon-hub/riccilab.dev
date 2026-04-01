"use client";

import { useRef, useEffect } from "react";
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

  return (
    <div
      ref={cardRef}
      className="group relative border border-border p-7 md:p-9 opacity-0 hover:border-black/30 transition-all duration-300"
    >
      {/* Top: category + index */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
          &gt; {project.category}
        </span>
        <span className="font-mono text-[10px] text-muted tracking-wider">
          [{String(index + 1).padStart(2, "0")}]
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-bold text-black tracking-tight mb-3 group-hover:translate-x-2 transition-transform duration-300">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted leading-relaxed mb-6">
        {project.description}
      </p>

      {/* Tech stack — terminal style */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tech.map((t) => (
          <span
            key={t}
            className="font-mono text-[11px] tracking-wider text-muted"
          >
            _{t}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-5 font-mono text-[11px] tracking-wider">
        {project.link && (
          <a
            href={project.link}
            className="text-black hover:text-muted transition-colors"
          >
            DEMO &rarr;
          </a>
        )}
        {project.github && (
          <a
            href={project.github}
            className="text-muted hover:text-black transition-colors"
          >
            SOURCE
          </a>
        )}
      </div>

      {/* Hover line */}
      <div className="absolute bottom-0 left-0 w-0 h-px bg-black group-hover:w-full transition-all duration-500" />
    </div>
  );
}

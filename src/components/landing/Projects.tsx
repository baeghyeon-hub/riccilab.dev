"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import Link from "next/link";
import type { Project } from "@/lib/projects";

interface Row {
  id: string;
  title: string;
  desc: string;
  year: string;
  role: string;
}

function ProjectRow({ project }: { project: Row }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const descRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const enter = () => {
      gsap.to(titleRef.current, { x: 16, duration: 0.35, ease: "power2.out" });
      gsap.to(descRef.current, { opacity: 1, x: 8, duration: 0.4, ease: "power2.out" });
    };
    const leave = () => {
      gsap.to(titleRef.current, { x: 0, duration: 0.25, ease: "power2.inOut" });
      gsap.to(descRef.current, { opacity: 0, x: 0, duration: 0.25, ease: "power2.inOut" });
    };

    row.addEventListener("mouseenter", enter);
    row.addEventListener("mouseleave", leave);
    return () => {
      row.removeEventListener("mouseenter", enter);
      row.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      ref={rowRef}
      className="border-b border-border py-6 md:py-8 cursor-pointer flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 md:gap-8 min-w-0">
        <span className="text-sm text-muted shrink-0 w-8 tabular-nums">
          {project.id}
        </span>
        <span
          ref={titleRef}
          className="text-xl md:text-3xl font-semibold text-black truncate will-change-transform"
        >
          {project.title}
        </span>
        <span
          ref={descRef}
          className="text-sm text-muted hidden md:inline opacity-0 will-change-transform"
        >
          — {project.desc}
        </span>
      </div>

      <div className="flex items-center gap-6 shrink-0">
        <span className="text-xs text-muted hidden md:inline uppercase tracking-wider">
          {project.role}
        </span>
        <span className="text-sm text-muted tabular-nums">{project.year}</span>
      </div>
    </div>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%" },
        }
      );

      const rows = sectionRef.current?.querySelectorAll("[data-row]");
      rows?.forEach((row, i) => {
        gsap.fromTo(
          row,
          { y: 30, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 0.5, delay: i * 0.08,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 92%" },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (projects.length === 0) return null;

  const rows: Row[] = projects.map((p, i) => ({
    id: String(i + 1).padStart(2, "0"),
    title: p.title,
    desc: p.description,
    year: p.date ? p.date.slice(0, 4) : "",
    role: p.categoryName || p.status || "",
  }));

  return (
    <section ref={sectionRef} className="px-6 md:px-12 lg:px-20 py-24 md:py-36">
      <div className="max-w-[1100px] w-full mx-auto">
        <div ref={headingRef} className="flex items-baseline justify-between mb-12">
          <h2 className="text-xs tracking-[0.2em] text-muted uppercase">
            Selected Projects
          </h2>
          <Link href="/projects" className="text-xs text-muted hover:text-black transition-colors">
            View all &rarr;
          </Link>
        </div>

        <div className="border-t border-border">
          {rows.map((p) => (
            <div key={p.id} data-row>
              <ProjectRow project={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

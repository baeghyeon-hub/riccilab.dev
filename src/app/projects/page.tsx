import { PROJECTS } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJECTS",
  description: "프로젝트 갤러리",
};

export default function ProjectsPage() {
  return (
    <>
      <LabBackground />
      <Navigation />
      <section className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
                &gt; ls /lab/projects
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GlitchTitle text="PROJECTS" />

            <p className="font-mono text-sm tracking-wider text-muted mt-6">
              THINGS I&apos;VE BUILT &amp; EXPLORED
            </p>

            {/* Decorative data */}
            <div className="flex items-center gap-4 mt-8 font-mono text-[10px] text-muted tracking-wider">
              <span>COUNT: {String(PROJECTS.length).padStart(2, "0")}</span>
              <span>|</span>
              <span>TYPE: MIXED</span>
              <span>|</span>
              <span>STATUS: IN PROGRESS</span>
            </div>
          </div>

          {/* Project grid */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {PROJECTS.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

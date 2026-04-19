import { getAllProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CategoryFilter } from "@/components/categories/CategoryFilter";
import { getCategoryTree } from "@/lib/categories";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJECTS",
  description: "프로젝트 갤러리",
};

export default async function ProjectsPage() {
  const [projects, projectRoots] = await Promise.all([
    getAllProjects(),
    getCategoryTree("projects"),
  ]);

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
              <span>COUNT: {String(projects.length).padStart(2, "0")}</span>
              <span>|</span>
              <span>TYPE: MIXED</span>
              <span>|</span>
              <span>STATUS: IN PROGRESS</span>
            </div>
          </div>

          {/* Category filter (top-level categories from Notion) */}
          <CategoryFilter
            basePath="/projects"
            categoryBase="/projects/categories"
            roots={projectRoots}
          />

          {/* Project grid */}
          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {projects.map((project, i) => (
                <ProjectCard key={project.slug} project={project} index={i} />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 p-12 text-center">
              <p className="font-mono text-sm text-muted tracking-wider">
                NO PROJECTS YET — STAND BY...
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

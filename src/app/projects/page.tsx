import { getAllProjects } from "@/lib/projects";
import { CategoryCard } from "@/components/categories/CategoryCard";
import {
  getCategoryTree,
  collectSubtreeIds,
  flattenTree,
} from "@/lib/categories";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PROJECTS",
  description: "프로젝트 갤러리 — 카테고리별 인덱스",
  alternates: {
    canonical: "/projects",
  },
};

export default async function ProjectsPage() {
  const [projects, tree] = await Promise.all([
    getAllProjects(),
    getCategoryTree("projects"),
  ]);

  const allNodes = flattenTree(tree);
  const countForNode = (nodeIds: string[]) =>
    projects.filter((p) => p.categoryId && nodeIds.includes(p.categoryId))
      .length;
  const totalClassified = projects.filter((p) => p.categoryId).length;

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
                &gt; ls /lab/projects/by-category
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GlitchTitle text="PROJECTS" />

            <p className="font-mono text-sm tracking-wider text-muted mt-6">
              THINGS I&apos;VE BUILT &amp; EXPLORED — BROWSE BY CATEGORY
            </p>

            <div className="flex items-center gap-4 mt-8 font-mono text-[10px] text-muted tracking-wider">
              <span>TOPICS: {String(allNodes.length).padStart(3, "0")}</span>
              <span>|</span>
              <span>
                CLASSIFIED: {String(totalClassified).padStart(2, "0")}/
                {String(projects.length).padStart(2, "0")}
              </span>
              <span>|</span>
              <span>STATUS: IN PROGRESS</span>
            </div>
          </div>

          {/* Top-level category grid */}
          {tree.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {tree.map((node, i) => (
                <CategoryCard
                  key={node.id}
                  node={node}
                  basePath="/projects/categories"
                  count={countForNode(collectSubtreeIds(node))}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 p-12 text-center">
              <p className="font-mono text-sm text-muted tracking-wider">
                NO CATEGORIES YET — AWAITING INPUT
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

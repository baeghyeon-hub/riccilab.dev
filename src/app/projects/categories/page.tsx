import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";
import { CategoryCard } from "@/components/categories/CategoryCard";
import {
  getCategoryTree,
  collectSubtreeIds,
  flattenTree,
} from "@/lib/categories";
import { getAllProjects } from "@/lib/projects";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CATEGORIES — PROJECTS",
  description: "Browse projects by category.",
  alternates: { canonical: "/projects/categories" },
};

export default async function ProjectCategoriesPage() {
  const [tree, projects] = await Promise.all([
    getCategoryTree("projects"),
    getAllProjects(),
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
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <Link
              href="/projects"
              className="shrink-0 hover:text-black transition-colors"
            >
              &gt; projects
            </Link>
            <span className="shrink-0">/</span>
            <span className="text-black">categories</span>
          </div>

          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
                &gt; ls /lab/projects/by-category
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GlitchTitle text="CATEGORIES" />

            <p className="font-mono text-sm tracking-wider text-muted mt-6">
              TOPIC-ORGANIZED PROJECT INDEX
            </p>

            <div className="flex items-center gap-4 mt-8 font-mono text-[10px] text-muted tracking-wider">
              <span>TOPICS: {String(allNodes.length).padStart(3, "0")}</span>
              <span>|</span>
              <span>
                CLASSIFIED: {String(totalClassified).padStart(3, "0")}/
                {String(projects.length).padStart(3, "0")}
              </span>
            </div>
          </div>

          {/* Top-level grid */}
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

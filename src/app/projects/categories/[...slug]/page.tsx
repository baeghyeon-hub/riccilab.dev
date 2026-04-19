import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryFilter } from "@/components/categories/CategoryFilter";
import {
  getCategoryTree,
  resolveCategoryPath,
  collectSubtreeIds,
  flattenTree,
} from "@/lib/categories";
import { getAllProjects } from "@/lib/projects";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const tree = await getCategoryTree("projects");
  return flattenTree(tree).map((node) => ({ slug: node.path }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = await resolveCategoryPath(slug, "projects");
  if (!node) return { title: "Not Found" };

  const chainStr = slug.join(" / ");
  return {
    title: `${node.name} — PROJECTS`,
    description:
      node.description || `Projects in the ${chainStr} category.`,
    alternates: {
      canonical: `/projects/categories/${slug.join("/")}`,
    },
  };
}

export default async function ProjectCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [node, allProjects, projectRoots] = await Promise.all([
    resolveCategoryPath(slug, "projects"),
    getAllProjects(),
    getCategoryTree("projects"),
  ]);
  if (!node) notFound();

  const subtreeIds = collectSubtreeIds(node);
  const projects = allProjects.filter(
    (p) => p.categoryId && subtreeIds.includes(p.categoryId)
  );

  const activeRootSlug = slug[0];

  const crumbs = slug.map((seg, i) => ({
    seg,
    href: `/projects/categories/${slug.slice(0, i + 1).join("/")}`,
    isLast: i === slug.length - 1,
  }));

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
            <Link
              href="/projects/categories"
              className="shrink-0 hover:text-black transition-colors"
            >
              categories
            </Link>
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-x-2">
                <span className="shrink-0">/</span>
                {c.isLast ? (
                  <span className="text-black break-all">{c.seg}</span>
                ) : (
                  <Link
                    href={c.href}
                    className="shrink-0 hover:text-black transition-colors break-all"
                  >
                    {c.seg}
                  </Link>
                )}
              </span>
            ))}
          </div>

          {/* Category filter tabs */}
          <CategoryFilter
            basePath="/projects"
            categoryBase="/projects/categories"
            roots={projectRoots}
            activeSlug={activeRootSlug}
          />

          {/* Header */}
          <header className="mb-16">
            <div className="font-mono text-[11px] tracking-[0.2em] text-muted mb-4">
              &gt; CATEGORY
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight mb-6 leading-tight">
              {node.name}
            </h1>
            {node.description && (
              <p className="text-lg text-muted leading-relaxed mb-8 max-w-2xl">
                {node.description}
              </p>
            )}
            <div className="flex items-center gap-4 font-mono text-[10px] text-muted tracking-wider">
              <span>COUNT: {String(projects.length).padStart(2, "0")}</span>
              {node.children.length > 0 && (
                <>
                  <span>|</span>
                  <span>SUB: {String(node.children.length).padStart(2, "0")}</span>
                </>
              )}
            </div>
            <div className="h-px w-full bg-border mt-8" />
          </header>

          {/* Subcategories */}
          {node.children.length > 0 && (
            <div className="mb-16">
              <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6">
                &gt; SUBCATEGORIES
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {node.children.map((child, i) => (
                  <CategoryCard
                    key={child.id}
                    node={child}
                    basePath="/projects/categories"
                    count={
                      allProjects.filter(
                        (p) =>
                          p.categoryId &&
                          collectSubtreeIds(child).includes(p.categoryId)
                      ).length
                    }
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Project grid */}
          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6">
              &gt; PROJECTS
            </h2>
            {projects.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                {projects.map((project, i) => (
                  <ProjectCard key={project.slug} project={project} index={i} />
                ))}
              </div>
            ) : (
              <div className="border border-border/50 p-12 text-center">
                <p className="font-mono text-sm text-muted tracking-wider">
                  NO PROJECTS YET IN THIS CATEGORY
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

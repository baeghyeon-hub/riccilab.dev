import { ProjectCard } from "@/components/projects/ProjectCard";
import { CategoryDetailPage } from "@/components/categories/CategoryDetailPage";
import {
  getCategoryTree,
  resolveCategoryPath,
  flattenTree,
} from "@/lib/categories";
import { getAllProjects } from "@/lib/projects";
import { getItemsInCategorySubtree } from "@/lib/category-detail";
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

  const projects = getItemsInCategorySubtree(allProjects, node);

  return (
    <CategoryDetailPage
      sectionPath="/projects"
      sectionLabel="projects"
      categoryBasePath="/projects/categories"
      roots={projectRoots}
      node={node}
      slug={slug}
      allItems={allProjects}
      items={projects}
      maxWidthClassName="max-w-5xl mx-auto"
      countLabel="COUNT"
      listTitle="PROJECTS"
      listClassName="grid md:grid-cols-2 gap-6 md:gap-8"
      emptyMessage="NO PROJECTS YET IN THIS CATEGORY"
      getItemKey={(project) => project.slug}
      renderItem={(project, i) => <ProjectCard project={project} index={i} />}
    />
  );
}

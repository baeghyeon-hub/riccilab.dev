import { getAllProjects } from "@/lib/projects";
import { CategoryIndexPage } from "@/components/categories/CategoryIndexPage";
import { getCategoryTree } from "@/lib/categories";
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

  return (
    <CategoryIndexPage
      title="PROJECTS"
      terminalPath="> ls /lab/projects/by-category"
      description="THINGS I'VE BUILT & EXPLORED — BROWSE BY CATEGORY"
      status="IN PROGRESS"
      categoryBasePath="/projects/categories"
      items={projects}
      tree={tree}
      classifiedPad={2}
    />
  );
}

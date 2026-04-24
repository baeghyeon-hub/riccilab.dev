import { getAllPosts } from "@/lib/blog";
import { CategoryIndexPage } from "@/components/categories/CategoryIndexPage";
import { getCategoryTree } from "@/lib/categories";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BLOG",
  description: "코드와 크리에이티브의 기록 — 카테고리별 인덱스",
  alternates: {
    canonical: "/blog",
  },
};

export default async function BlogPage() {
  const [posts, tree] = await Promise.all([
    getAllPosts(),
    getCategoryTree("blog"),
  ]);

  return (
    <CategoryIndexPage
      title="BLOG"
      terminalPath="> ls /lab/notes/by-category"
      description="THOUGHTS, CODE & CREATIVE NOTES — BROWSE BY CATEGORY"
      status="ACTIVE"
      categoryBasePath="/blog/categories"
      items={posts}
      tree={tree}
      classifiedPad={3}
    />
  );
}

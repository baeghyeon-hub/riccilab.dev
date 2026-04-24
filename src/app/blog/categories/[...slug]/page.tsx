import { BlogCard } from "@/components/blog/BlogCard";
import { CategoryDetailPage } from "@/components/categories/CategoryDetailPage";
import {
  getCategoryTree,
  resolveCategoryPath,
  flattenTree,
} from "@/lib/categories";
import { getAllPosts } from "@/lib/blog";
import {
  getItemsInCategorySubtree,
  sortItemsByDateDesc,
} from "@/lib/category-detail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const tree = await getCategoryTree("blog");
  return flattenTree(tree).map((node) => ({ slug: node.path }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const node = await resolveCategoryPath(slug, "blog");
  if (!node) return { title: "Not Found" };

  const chainStr = slug.join(" / ");
  return {
    title: `${node.name} — BLOG`,
    description:
      node.description ||
      `Blog posts in the ${chainStr} category.`,
    alternates: {
      canonical: `/blog/categories/${slug.join("/")}`,
    },
  };
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const [node, allPosts, blogRoots] = await Promise.all([
    resolveCategoryPath(slug, "blog"),
    getAllPosts(),
    getCategoryTree("blog"),
  ]);
  if (!node) notFound();

  const posts = sortItemsByDateDesc(
    getItemsInCategorySubtree(allPosts, node)
  );

  return (
    <CategoryDetailPage
      sectionPath="/blog"
      sectionLabel="blog"
      categoryBasePath="/blog/categories"
      roots={blogRoots}
      node={node}
      slug={slug}
      allItems={allPosts}
      items={posts}
      maxWidthClassName="max-w-4xl mx-auto"
      countLabel="ENTRIES"
      listTitle="ENTRIES"
      listClassName="border-t border-border"
      emptyMessage="NO ENTRIES YET IN THIS CATEGORY"
      getItemKey={(post) => post.slug}
      renderItem={(post, i) => <BlogCard post={post} index={i} />}
    />
  );
}

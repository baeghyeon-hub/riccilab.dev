import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { CategoryCard } from "@/components/categories/CategoryCard";
import { CategoryFilter } from "@/components/categories/CategoryFilter";
import {
  getCategoryTree,
  resolveCategoryPath,
  collectSubtreeIds,
  flattenTree,
} from "@/lib/categories";
import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
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

  const subtreeIds = collectSubtreeIds(node);
  const posts = allPosts
    .filter((p) => p.categoryId && subtreeIds.includes(p.categoryId))
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  const activeRootSlug = slug[0];

  // Build breadcrumb links from path
  const crumbs = slug.map((seg, i) => ({
    seg,
    href: `/blog/categories/${slug.slice(0, i + 1).join("/")}`,
    isLast: i === slug.length - 1,
  }));

  return (
    <>
      <LabBackground />
      <Navigation />
      <section className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <Link href="/blog" className="shrink-0 hover:text-black transition-colors">
              &gt; blog
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
            basePath="/blog"
            categoryBase="/blog/categories"
            roots={blogRoots}
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
              <span>ENTRIES: {String(posts.length).padStart(2, "0")}</span>
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
                    basePath="/blog/categories"
                    count={
                      allPosts.filter(
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

          {/* Post list */}
          <div>
            <h2 className="font-mono text-[11px] tracking-[0.2em] text-muted mb-6">
              &gt; ENTRIES
            </h2>
            {posts.length > 0 ? (
              <div className="border-t border-border">
                {posts.map((post, i) => (
                  <BlogCard key={post.slug} post={post} index={i} />
                ))}
              </div>
            ) : (
              <div className="border border-border/50 p-12 text-center">
                <p className="font-mono text-sm text-muted tracking-wider">
                  NO ENTRIES YET IN THIS CATEGORY
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

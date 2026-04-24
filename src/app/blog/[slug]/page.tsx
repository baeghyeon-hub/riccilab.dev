import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { ContentProtect } from "@/components/blog/ContentProtect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  BLOG_PROSE_CLASS,
  mdxRemoteOptions,
  sharedMdxComponents,
} from "@/components/mdx/mdx-rendering";
import { articleJsonLd } from "@/lib/jsonld";
import { GiscusComments } from "@/components/blog/GiscusComments";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { extractHeadings } from "@/lib/toc";
import Link from "next/link";
import { getCategoryChain } from "@/lib/categories";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${slug}`,
      publishedTime: post.date ? new Date(post.date).toISOString() : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const headings = extractHeadings(post.content);
  const categoryChain = await getCategoryChain(post.categoryId ?? null);

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd({
            title: post.title,
            description: post.description,
            date: post.date,
            slug,
            tags: post.tags,
          })),
        }}
      />
      <LabBackground />
      <Navigation />
      <article className="relative min-h-screen pt-32 pb-20 px-6 md:px-16 select-none">
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
        <div>
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <Link href="/blog" className="shrink-0 hover:text-black transition-colors">
              &gt; blog
            </Link>
            {categoryChain.map((cat, i) => {
              const href = `/blog/categories/${categoryChain
                .slice(0, i + 1)
                .map((c) => c.slug)
                .join("/")}`;
              return (
                <span key={cat.id} className="flex items-center gap-x-2">
                  <span className="shrink-0">/</span>
                  <Link
                    href={href}
                    className="shrink-0 hover:text-black transition-colors"
                  >
                    {cat.slug}
                  </Link>
                </span>
              );
            })}
            <span className="shrink-0">/</span>
            <span className="text-black break-all">{decodeURIComponent(slug)}</span>
          </div>

          {/* Post header */}
          <header className="mb-16">
            <time className="font-mono text-[11px] tracking-[0.2em] text-muted">
              {post.date}
            </time>
            <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight mt-4 mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Terminal-style tags */}
            <div className="flex flex-wrap gap-3">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="font-mono text-[11px] tracking-wider text-muted"
                >
                  _{tag.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="h-px w-full bg-border mt-8" />
          </header>

          {/* Content */}
          <ContentProtect>
          <div className={BLOG_PROSE_CLASS}>
            <MDXRemote 
              source={post.content} 
              components={sharedMdxComponents}
              options={mdxRemoteOptions}
            />
          </div>
          </ContentProtect>

          {/* End mark */}
          <div className="mt-16 pt-8 border-t border-border font-mono text-[10px] text-muted tracking-wider">
            EOF — {post.date}
          </div>

          {/* Comments */}
          <GiscusComments />
        </div>

        {/* TOC sidebar */}
        <aside className="hidden lg:block">
          <TableOfContents headings={headings} />
        </aside>
        </div>
      </article>
      <Footer />
    </>
  );
}

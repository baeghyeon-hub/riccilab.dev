import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { ContentProtect } from "@/components/blog/ContentProtect";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import katex from "katex";
import { codeToHtml } from "shiki";

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
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/og-image.png"],
    },
  };
}

import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import { CyberChart } from "@/components/blog/CyberChart";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { articleJsonLd } from "@/lib/jsonld";

const mdxComponents = {
  CyberChart: (props: any) => {
    return <CyberChart dataString={props.data} type={props.type || "stepAfter"} yScale={props.yScale || "linear"} />;
  },
  pre: (props: any) => <CodeBlock {...props} />,
  code: ({ className, children, ...props }: any) => {
    return <code className={className} {...props}>{children}</code>;
  },
  img: (props: any) => (
    <figure className="my-10">
      <img {...props} className="w-full rounded border border-black/10" />
      {props.alt && <figcaption className="text-center text-sm text-muted mt-3 font-mono tracking-wide">{props.alt}</figcaption>}
    </figure>
  ),
  table: (props: any) => (
    <div className="table-wrap my-8 overflow-x-auto -mx-5 px-5">
      <table className="min-w-[600px] w-full border-collapse text-sm" {...props} />
    </div>
  )
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

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
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <span className="shrink-0">&gt; blog</span>
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
          <div className="prose prose-neutral max-w-none overflow-hidden text-black/90 leading-[1.85] text-base md:text-lg [&_p]:mb-5 [&_p]:mt-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-14 [&_h1]:mb-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-14 [&_h2]:mb-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-10 [&_h3]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:italic [&_blockquote]:text-muted [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-black [&_ul]:my-5 [&_ul]:space-y-2 [&_li]:text-black/80 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_.math-block]:my-8 [&_.math-block]:text-center [&_.table-wrap]:my-8 [&_.table-wrap]:overflow-x-auto [&_.table-wrap]:-mx-5 [&_.table-wrap]:px-5 [&_table]:min-w-[600px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:text-left [&_th]:px-4 [&_th]:py-3 [&_th]:border-b [&_th]:border-black/20 [&_th]:text-black [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-black/10 [&_td]:align-top [&_figure]:my-10 [&_figure_img]:w-full [&_figure_img]:rounded [&_figure_img]:border [&_figure_img]:border-black/10 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted [&_figcaption]:mt-3 [&_figcaption]:font-mono [&_figcaption]:tracking-wide [&_pre]:bg-[#121212] [&_pre]:text-white/90 [&_pre]:p-4 [&_pre]:md:p-5 [&_pre]:my-8 [&_pre]:md:my-10 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:md:text-sm [&_pre]:shadow-lg [&_pre]:leading-relaxed [&_pre]:tracking-wide [&_pre]:max-w-full [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-xs [&_pre_code]:md:text-sm">
            <MDXRemote 
              source={post.content} 
              components={mdxComponents}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm, remarkMath],
                  rehypePlugins: [rehypeKatex, [rehypePrettyCode, { theme: "vitesse-dark" }]]
                }
              }}
            />
          </div>
          </ContentProtect>

          {/* End mark */}
          <div className="mt-16 pt-8 border-t border-border font-mono text-[10px] text-muted tracking-wider">
            EOF — {post.date}
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}

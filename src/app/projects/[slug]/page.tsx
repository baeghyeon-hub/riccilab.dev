import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { CyberChart } from "@/components/blog/CyberChart";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { BASE_URL, SITE_NAME } from "@/lib/constants";
import { getCategoryChain } from "@/lib/categories";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Not Found" };

  return {
    title: project.title,
    description: project.description,
    keywords: [project.categoryName, ...project.tech].filter(Boolean),
    alternates: {
      canonical: `/projects/${slug}`,
    },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.description,
      url: `/projects/${slug}`,
      publishedTime: project.date ? new Date(project.date).toISOString() : undefined,
      tags: project.tech,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
    },
  };
}

const mdxComponents = {
  CyberChart: (props: any) => (
    <CyberChart
      dataString={props.data}
      type={props.type || "stepAfter"}
      yScale={props.yScale || "linear"}
    />
  ),
  pre: (props: any) => <CodeBlock {...props} />,
  code: ({ className, children, ...props }: any) => (
    <code className={className} {...props}>
      {children}
    </code>
  ),
  img: (props: any) => (
    <figure className="my-10">
      <img {...props} className="w-full rounded border border-black/10" />
      {props.alt && (
        <figcaption className="text-center text-sm text-muted mt-3 font-mono tracking-wide">
          {props.alt}
        </figcaption>
      )}
    </figure>
  ),
  table: (props: any) => (
    <div className="table-wrap my-8 overflow-x-auto -mx-5 px-5">
      <table className="min-w-[600px] w-full border-collapse text-sm" {...props} />
    </div>
  ),
};

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const categoryChain = await getCategoryChain(project.categoryId ?? null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: `${BASE_URL}/projects/${slug}`,
    dateCreated: project.date ? new Date(project.date).toISOString() : undefined,
    keywords: [project.categoryName, ...project.tech].filter(Boolean).join(", "),
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: BASE_URL,
    },
    inLanguage: "ko",
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LabBackground />
      <Navigation />
      <article className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <Link href="/projects" className="shrink-0 hover:text-black transition-colors">
              &gt; projects
            </Link>
            {categoryChain.map((cat, i) => {
              const href = `/projects/categories/${categoryChain
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

          {/* Header */}
          <header className="mb-16">
            <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-[11px] tracking-[0.2em] text-muted">
              {project.categoryName && <span>&gt; {project.categoryName.toUpperCase()}</span>}
              {project.status && (
                <>
                  <span>|</span>
                  <span>STATUS: {project.status.toUpperCase()}</span>
                </>
              )}
              {project.date && (
                <>
                  <span>|</span>
                  <time>{project.date}</time>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-black tracking-tight mb-6 leading-tight">
              {project.title}
            </h1>

            {project.description && (
              <p className="text-lg text-muted leading-relaxed mb-8 max-w-2xl">
                {project.description}
              </p>
            )}

            {/* Tech stack */}
            {project.tech.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[11px] tracking-wider text-muted"
                  >
                    _{t}
                  </span>
                ))}
              </div>
            )}

            {/* External links */}
            {(project.link || project.github) && (
              <div className="flex gap-6 font-mono text-[12px] tracking-wider">
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-black hover:text-muted transition-colors underline underline-offset-4"
                  >
                    DEMO &rarr;
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted hover:text-black transition-colors underline underline-offset-4"
                  >
                    SOURCE &rarr;
                  </a>
                )}
              </div>
            )}

            <div className="h-px w-full bg-border mt-12" />
          </header>

          {/* Content */}
          {project.content.trim().length > 0 ? (
            <div className="prose prose-neutral max-w-none overflow-hidden text-black/90 leading-[1.85] text-base md:text-lg [&_p]:mb-5 [&_p]:mt-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-14 [&_h1]:mb-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-14 [&_h2]:mb-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-10 [&_h3]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:italic [&_blockquote]:text-muted [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-black [&_ul]:my-5 [&_ul]:space-y-2 [&_li]:text-black/80 [&_pre]:bg-[#121212] [&_pre]:text-white/90 [&_pre]:p-4 [&_pre]:md:p-5 [&_pre]:my-8 [&_pre]:md:my-10 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre]:md:text-sm [&_pre]:shadow-lg [&_pre]:leading-relaxed [&_pre]:tracking-wide [&_pre]:max-w-full">
              <MDXRemote
                source={project.content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm, remarkMath],
                    rehypePlugins: [
                      rehypeSlug,
                      rehypeKatex,
                      [rehypePrettyCode, { theme: "vitesse-dark" }],
                    ],
                  },
                }}
              />
            </div>
          ) : (
            <div className="border border-border/50 p-12 text-center">
              <p className="font-mono text-sm text-muted tracking-wider">
                NO CONTENT YET — DETAILS COMING SOON
              </p>
            </div>
          )}

          {/* End mark */}
          <div className="mt-20 pt-8 border-t border-border font-mono text-[10px] text-muted tracking-wider">
            EOF {project.date && <>— {project.date}</>}
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}

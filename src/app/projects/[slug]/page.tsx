import { getAllProjects, getProjectBySlug } from "@/lib/projects";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { ContentProtect } from "@/components/blog/ContentProtect";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { TraceViewer } from "@/components/regex-viz/TraceViewer";
import { fsProjectComponents } from "@/lib/fs-projects-registry";
import { BASE_URL, SITE_NAME } from "@/lib/constants";
import { getCategoryChain } from "@/lib/categories";
import {
  PROJECT_PROSE_CLASS,
  mdxRemoteOptions,
  projectTableMdxComponents,
  sharedMdxComponents,
} from "@/components/mdx/mdx-rendering";

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
  TraceViewer,
  ...sharedMdxComponents,
  ...projectTableMdxComponents,
};

// Branch on source: filesystem MDX projects are compiled via @next/mdx so
// their top-level `import` / JSON imports resolve through webpack, while
// Notion-sourced strings go through next-mdx-remote without a bundler pass.
async function renderProjectContent(slug: string, content: string) {
  const fsLoader = fsProjectComponents[slug];
  if (fsLoader) {
    const { default: MdxContent } = await fsLoader();
    return (
      <div className={PROJECT_PROSE_CLASS}>
        <MdxContent components={mdxComponents} />
      </div>
    );
  }

  if (content.trim().length === 0) {
    return (
      <div className="border border-border/50 p-12 text-center">
        <p className="font-mono text-sm text-muted tracking-wider">
          NO CONTENT YET — DETAILS COMING SOON
        </p>
      </div>
    );
  }

  return (
    <div className={PROJECT_PROSE_CLASS}>
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={mdxRemoteOptions}
      />
    </div>
  );
}

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
          <ContentProtect>
            {await renderProjectContent(slug, project.content)}
          </ContentProtect>

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

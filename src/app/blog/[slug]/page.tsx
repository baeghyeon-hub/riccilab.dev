import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} — RICCILAB`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <LabBackground />
      <Navigation />
      <article className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-12 font-mono text-[11px] tracking-[0.15em] text-muted">
            <span>&gt; blog</span>
            <span>/</span>
            <span className="text-black">{slug}</span>
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
          <div className="prose prose-neutral max-w-none text-black/80 leading-relaxed text-base md:text-lg [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-12 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-10 [&_h2]:mb-4 [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-muted [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-black [&_li]:text-black/70 [&_code]:font-mono [&_code]:text-sm [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
          </div>

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

function renderMarkdown(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h2>${processInline(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith("# ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h1>${processInline(trimmed.slice(2))}</h1>`;
    } else if (trimmed.startsWith("> ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<blockquote><p>${processInline(trimmed.slice(2))}</p></blockquote>`;
    } else if (trimmed.startsWith("- ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${processInline(trimmed.slice(2))}</li>`;
    } else if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p>${processInline(trimmed)}</p>`;
    }
  }

  if (inList) html += "</ul>";
  return html;
}

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

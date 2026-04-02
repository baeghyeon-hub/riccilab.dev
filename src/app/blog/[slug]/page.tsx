import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { Navigation } from "@/components/layout/Navigation";
import { ContentProtect } from "@/components/blog/ContentProtect";
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
        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm rounded-lg px-5 py-10 md:px-10 md:py-14">
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
          <ContentProtect>
          <div className="prose prose-neutral max-w-none text-black/90 leading-relaxed text-base md:text-lg [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-black [&_h1]:mt-12 [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-black/20 [&_blockquote]:pl-6 [&_blockquote]:italic [&_blockquote]:text-muted [&_a]:text-black [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-black [&_li]:text-black/80 [&_code]:font-mono [&_code]:text-sm [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_.math-block]:my-6 [&_.math-block]:text-center [&_.math-block_code]:text-base [&_.math-block_code]:bg-surface [&_.math-block_code]:px-4 [&_.math-block_code]:py-2 [&_.math-block_code]:rounded [&_.table-wrap]:my-6 [&_.table-wrap]:overflow-x-auto [&_.table-wrap]:-mx-5 [&_.table-wrap]:px-5 [&_table]:min-w-[600px] [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:text-left [&_th]:px-4 [&_th]:py-3 [&_th]:border-b [&_th]:border-black/20 [&_th]:text-black [&_th]:font-semibold [&_th]:whitespace-nowrap [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-black/10 [&_td]:align-top [&_figure]:my-8 [&_figure_img]:w-full [&_figure_img]:rounded [&_figure_img]:border [&_figure_img]:border-black/10 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted [&_figcaption]:mt-3 [&_figcaption]:font-mono [&_figcaption]:tracking-wide">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
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

function renderMarkdown(content: string): string {
  const lines = content.split("\n");
  let html = "";
  let inList = false;
  let inTable = false;
  let tableRowIndex = 0;
  let inMath = false;
  let mathContent = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Math block ($$...$$)
    if (trimmed.startsWith("$$") && !inMath) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inTable) { html += "</tbody></table></div>"; inTable = false; }
      const inline = trimmed.slice(2).trim();
      if (inline.endsWith("$$") && inline.length > 2) {
        html += `<div class="math-block"><code>${escapeHtml(inline.slice(0, -2))}</code></div>`;
      } else {
        inMath = true;
        mathContent = inline;
      }
      continue;
    }
    if (inMath) {
      if (trimmed.endsWith("$$")) {
        mathContent += (mathContent ? " " : "") + trimmed.slice(0, -2);
        html += `<div class="math-block"><code>${escapeHtml(mathContent.trim())}</code></div>`;
        inMath = false;
        mathContent = "";
      } else {
        mathContent += (mathContent ? " " : "") + trimmed;
      }
      continue;
    }

    // Table rows
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      if (inList) { html += "</ul>"; inList = false; }
      const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());

      // Separator row (| --- | --- |)
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (!inTable) {
        html += `<div class="table-wrap"><table><thead><tr>`;
        cells.forEach((c) => { html += `<th>${processInline(c)}</th>`; });
        html += `</tr></thead><tbody>`;
        inTable = true;
        tableRowIndex = 0;
      } else {
        html += `<tr>`;
        cells.forEach((c) => { html += `<td>${processInline(c)}</td>`; });
        html += `</tr>`;
        tableRowIndex++;
      }
      continue;
    }

    if (inTable) { html += "</tbody></table></div>"; inTable = false; }

    // Image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<figure><img src="${imgMatch[2]}" alt="${imgMatch[1]}" loading="lazy" />${imgMatch[1] ? `<figcaption>${imgMatch[1]}</figcaption>` : ""}</figure>`;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<h3>${processInline(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith("## ")) {
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
  if (inTable) html += "</tbody></table></div>";
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function processInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

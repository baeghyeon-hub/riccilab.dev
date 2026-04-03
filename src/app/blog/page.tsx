import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog/BlogCard";
import { Footer } from "@/components/ui/Footer";
import { LabBackground } from "@/components/ui/LabBackground";
import { GlitchTitle } from "@/components/ui/GlitchTitle";
import { Navigation } from "@/components/layout/Navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BLOG — RICCILAB",
  description: "코드와 크리에이티브의 기록",
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <LabBackground />
      <Navigation />
      <section className="relative min-h-screen pt-32 pb-20 px-6 md:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted">
                &gt; cd /lab/notes
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <GlitchTitle text="BLOG" />

            <p className="font-mono text-sm tracking-wider text-muted mt-6">
              THOUGHTS, CODE &amp; CREATIVE NOTES
            </p>

            {/* Decorative data line */}
            <div className="flex items-center gap-4 mt-8 font-mono text-[10px] text-muted tracking-wider">
              <span>ENTRIES: {String(posts.length).padStart(3, "0")}</span>
              <span>|</span>
              <span>STATUS: ACTIVE</span>
              <span>|</span>
              <span>FREQ: IRREGULAR</span>
            </div>
          </div>

          {/* Post list */}
          {posts.length > 0 ? (
            <div className="border-t border-border">
              {posts.map((post, i) => (
                <BlogCard key={post.slug} post={post} index={i} />
              ))}
            </div>
          ) : (
            <div className="border border-border/50 p-12 text-center">
              <p className="font-mono text-sm text-muted tracking-wider">
                NO ENTRIES FOUND — SIGNAL PENDING...
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}

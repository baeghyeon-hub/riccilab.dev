"use client";

import Link from "next/link";

interface TagFilterProps {
  tags: string[];
  activeTag?: string;
}

export function TagFilter({ tags, activeTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-12">
      <Link
        href="/blog"
        className={`font-mono text-[11px] tracking-wider px-3 py-1.5 border transition-colors ${
          !activeTag
            ? "border-black text-black"
            : "border-border text-muted hover:border-black/30 hover:text-black/60"
        }`}
      >
        _ALL
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={activeTag === tag ? "/blog" : `/blog?tag=${tag}`}
          className={`font-mono text-[11px] tracking-wider px-3 py-1.5 border transition-colors ${
            activeTag === tag
              ? "border-black text-black"
              : "border-border text-muted hover:border-black/30 hover:text-black/60"
          }`}
        >
          _{tag.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

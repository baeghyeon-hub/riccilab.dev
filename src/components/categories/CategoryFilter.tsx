import Link from "next/link";
import type { CategoryNode } from "@/lib/categories";

interface Props {
  /** Where "_ALL" points to. e.g. "/blog" or "/projects". */
  basePath: string;
  /** Prefix for category links. e.g. "/blog/categories". */
  categoryBase: string;
  /** Top-level category nodes to render as tabs. */
  roots: CategoryNode[];
  /** Currently active top-level slug (when rendered on a category page). */
  activeSlug?: string;
}

/**
 * Top-bar filter showing top-level categories from Notion.
 * Replaces the old tag-based filter on blog/projects index pages.
 * Each tab links to `${categoryBase}/${slug}`; `_ALL` links to `basePath`.
 */
export function CategoryFilter({
  basePath,
  categoryBase,
  roots,
  activeSlug,
}: Props) {
  if (roots.length === 0) return null;
  const allActive = !activeSlug;

  return (
    <div className="flex flex-wrap gap-2 mb-12">
      <Link
        href={basePath}
        className={`font-mono text-[11px] tracking-wider px-3 py-1.5 border transition-colors ${
          allActive
            ? "border-black text-black"
            : "border-border text-muted hover:border-black/30 hover:text-black/60"
        }`}
      >
        _ALL
      </Link>
      {roots.map((node) => {
        const active = activeSlug === node.slug;
        return (
          <Link
            key={node.id}
            href={`${categoryBase}/${node.slug}`}
            className={`font-mono text-[11px] tracking-wider px-3 py-1.5 border transition-colors ${
              active
                ? "border-black text-black"
                : "border-border text-muted hover:border-black/30 hover:text-black/60"
            }`}
          >
            _{node.name.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}

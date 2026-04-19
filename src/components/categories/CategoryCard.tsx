import Link from "next/link";
import type { CategoryNode } from "@/lib/categories";

interface Props {
  node: CategoryNode;
  basePath: string; // e.g. "/blog/categories"
  count: number; // posts/projects in this subtree
  index: number;
}

export function CategoryCard({ node, basePath, count, index }: Props) {
  const href = `${basePath}/${node.path.join("/")}`;
  return (
    <Link
      href={href}
      className="group relative block border border-border p-7 md:p-9 hover:border-black/30 transition-all duration-300"
    >
      {/* Top row: breadcrumb-ish slug trail + index */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted truncate">
          &gt; {node.path.join(" / ")}
        </span>
        <span className="font-mono text-[10px] text-muted tracking-wider shrink-0 ml-3">
          [{String(index + 1).padStart(2, "0")}]
        </span>
      </div>

      {/* Name */}
      <h3 className="text-xl md:text-2xl font-bold text-black tracking-tight mb-3 group-hover:translate-x-2 transition-transform duration-300">
        {node.name}
      </h3>

      {/* Description */}
      {node.description && (
        <p className="text-sm text-muted leading-relaxed mb-6">
          {node.description}
        </p>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 font-mono text-[11px] tracking-wider text-muted">
        <span>ENTRIES: {String(count).padStart(2, "0")}</span>
        {node.children.length > 0 && (
          <>
            <span>|</span>
            <span>SUB: {String(node.children.length).padStart(2, "0")}</span>
          </>
        )}
      </div>

      {/* Hover line */}
      <div className="absolute bottom-0 left-0 w-0 h-px bg-black group-hover:w-full transition-all duration-500" />
    </Link>
  );
}

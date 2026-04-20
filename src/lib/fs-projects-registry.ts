import type { ComponentType } from "react";

// Filesystem MDX project registry — one entry per `.mdx` file under
// `src/content/projects/`. Must be manually kept in sync when adding a new
// local project, because `@next/mdx` resolves imports at build time via
// webpack, which means the import path has to be a static string literal
// (dynamic `import(slug)` here would break local `import` / JSON paths
// inside the MDX).
//
// The trade-off: one line of boilerplate per new MDX post, in exchange for
// inline React components (e.g. regex-viz/TraceViewer) and local JSON data
// imports working naturally in MDX. Notion-only projects don't touch this.

export type MdxComponentProps = {
  components?: Record<string, ComponentType<any>>;
};

export const fsProjectComponents: Record<
  string,
  () => Promise<{ default: ComponentType<MdxComponentProps> }>
> = {
  "thompsons-construction-visible": () =>
    import("@/content/projects/thompsons-construction-visible.mdx"),
};

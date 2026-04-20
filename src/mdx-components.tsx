import type { MDXComponents } from "mdx/types";

// Required by `@next/mdx` in the App Router. Without this file, MDX modules
// compiled through webpack fall back to `@mdx-js/react`'s MDXProvider, which
// calls `React.createContext` at module scope — illegal in Server Components
// and the source of the "c.default.createContext is not a function"
// prerender error we hit with Turbopack.
//
// Per-page component overrides (e.g. the blog / project detail pages'
// CyberChart, Mermaid, CodeBlock, TraceViewer) are still passed via the
// `components` prop at render time; this file just supplies the default
// merge hook so MDX modules can resolve them.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}

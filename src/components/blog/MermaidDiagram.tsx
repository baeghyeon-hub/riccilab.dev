"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

interface Props {
  code: string;
}

/**
 * Client-side Mermaid renderer. Accepts the raw diagram source as a prop
 * (already extracted from the Notion-exported ``` mermaid ``` fence by the
 * notion→MDX converter in src/lib/notion.ts).
 *
 * The mermaid library is loaded dynamically so it doesn't ship in the
 * critical bundle of posts that don't use diagrams.
 */
export function MermaidDiagram({ code }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef<string>(`mermaid-${++idCounter}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDark ? "dark" : "neutral",
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
          flowchart: { curve: "basis", padding: 16 },
        });
        const { svg: rendered } = await mermaid.render(idRef.current, code);
        if (!cancelled) setSvg(rendered);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre className="my-6 whitespace-pre-wrap rounded border border-red-500/30 bg-red-500/5 p-4 text-xs text-red-600 dark:text-red-400">
        {"mermaid render error: " + error + "\n\n" + code}
      </pre>
    );
  }

  return (
    <div
      className="my-8 flex justify-center overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      role="figure"
      aria-label="diagram"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

let idCounter = 0;

interface Props {
  code: string;
}

const FONT_MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';

/**
 * Palette pulled from `src/app/globals.css` — we mirror the CSS custom
 * properties so the diagram inherits the same monochrome / cyber-lab
 * tone as the rest of the site (thin 1px lines, muted grays, accent
 * green used sparingly).
 */
const SITE = {
  light: {
    bg: "#ffffff",
    surface: "#f5f5f5",
    black: "#111111",
    muted: "#777777",
    accent: "#00aa55",
    border: "#e0e0e0",
  },
  dark: {
    bg: "#111111",
    surface: "#1e1e1e",
    black: "#f0f0f0",
    muted: "#888888",
    accent: "#33cc77",
    border: "#333333",
  },
} as const;

function buildThemeVariables(isDark: boolean) {
  const c = isDark ? SITE.dark : SITE.light;
  return {
    // Canvas
    background: "transparent",
    // Primary node — high-contrast outline so structure reads at a glance.
    // We use --black for borders/lines (the same ink used for body text)
    // because --border (#e0e0e0) and --muted (#777) are too faint on a
    // white page once stroke-width drops to 1px.
    primaryColor: c.bg,
    primaryTextColor: c.black,
    primaryBorderColor: c.black,
    secondaryColor: c.bg,
    secondaryTextColor: c.black,
    secondaryBorderColor: c.black,
    tertiaryColor: c.bg,
    tertiaryTextColor: c.black,
    tertiaryBorderColor: c.black,
    // Edges
    lineColor: c.black,
    textColor: c.black,
    // Flowchart specifics
    mainBkg: c.bg,
    nodeBorder: c.black,
    // Subgraphs stay as soft chrome — dashed muted border, no fill, so
    // they read as containers rather than another solid node.
    clusterBkg: "transparent",
    clusterBorder: c.muted,
    edgeLabelBackground: c.bg,
    titleColor: c.muted,
    // Type
    fontFamily: FONT_MONO,
    fontSize: "12px",
  };
}

/**
 * themeCSS is rebuilt per render because SVG `fill` needs explicit color
 * values — theme variables alone don't force cluster labels / edge
 * labels onto the muted tone we want, especially across dark-mode toggles.
 */
function buildThemeCSS(isDark: boolean) {
  const c = isDark ? SITE.dark : SITE.light;
  return `
    .cluster > rect {
      stroke-dasharray: 2 3;
      stroke-width: 1px;
      rx: 2;
      ry: 2;
    }
    .cluster .cluster-label,
    .cluster .nodeLabel,
    .cluster text,
    .cluster-label text {
      fill: ${c.muted} !important;
      color: ${c.muted} !important;
      font-size: 10px !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase;
      font-weight: 500;
    }
    .edgeLabel,
    .edgeLabel span,
    .edgeLabel text,
    .edgeLabel foreignObject {
      fill: ${c.muted} !important;
      color: ${c.muted} !important;
      font-size: 10px !important;
      letter-spacing: 0.08em !important;
    }
    .edgeLabel rect,
    .edgeLabels rect {
      fill: ${c.bg} !important;
    }
    .node rect,
    .node polygon,
    .node circle,
    .node ellipse,
    .node path {
      stroke-width: 1px;
      rx: 2;
      ry: 2;
    }
    .node .label,
    .nodeLabel,
    .nodeLabel p {
      fill: ${c.black} !important;
      color: ${c.black} !important;
      font-weight: 500;
      letter-spacing: 0.02em;
      margin: 0;
    }
    .flowchart-link,
    .messageLine0,
    .messageLine1,
    .relationshipLine,
    .transition {
      stroke: ${c.black} !important;
      stroke-width: 1px;
    }
    .marker,
    .arrowheadPath,
    .flowchart-link + defs marker path {
      fill: ${c.black} !important;
      stroke: ${c.black} !important;
      stroke-width: 1px;
    }
  `;
}

export function MermaidDiagram({ code }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const latestRenderId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!code) return;
      const renderId = ++latestRenderId.current;
      try {
        const mermaid = (await import("mermaid")).default;
        const isDark = document.documentElement.classList.contains("dark");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: FONT_MONO,
          themeVariables: buildThemeVariables(isDark),
          themeCSS: buildThemeCSS(isDark),
          flowchart: {
            curve: "linear",
            padding: 14,
            nodeSpacing: 48,
            rankSpacing: 56,
            htmlLabels: false,
            useMaxWidth: true,
          },
          sequence: { useMaxWidth: true },
          gantt: { useMaxWidth: true },
          class: { useMaxWidth: true },
          state: { useMaxWidth: true },
        });
        const id = `mermaid-${++idCounter}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const { svg: rendered } = await mermaid.render(id, code);
        // Drop stale results from superseded renders (e.g. rapid theme toggles)
        if (cancelled || renderId !== latestRenderId.current) return;
        setSvg(rendered);
        setError("");
      } catch (e: unknown) {
        if (cancelled || renderId !== latestRenderId.current) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    void render();

    // Re-render when the site's dark-mode class toggles so the palette
    // always matches the rest of the page.
    const observer = new MutationObserver(() => {
      if (!cancelled) void render();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
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
    <figure className="my-10">
      <div className="relative border border-black/20 dark:border-white/15 bg-bg/40 px-4 pt-8 pb-6 md:pt-10 md:pb-8 overflow-x-auto">
        {/* Corner telemetry labels — blend with the site's cyber-lab chrome */}
        <span className="pointer-events-none absolute top-2 left-3 select-none font-mono text-[9px] tracking-[0.25em] text-muted">
          &gt; DIAGRAM
        </span>
        <span className="pointer-events-none absolute top-2 right-3 select-none font-mono text-[9px] tracking-[0.25em] text-muted">
          MERMAID.RENDER
        </span>
        <div
          className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          role="figure"
          aria-label="diagram"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </figure>
  );
}

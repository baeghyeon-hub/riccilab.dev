"use client";

// DfaGraph — dagre layout + SVG, tuned for subset-construction output.
//
// Differs from NfaGraph in four ways:
//   1. Multiple accept states (double-circle drawn on every `is_accept`).
//   2. No ε-transitions; every edge has a single-char label.
//   3. Each node can show the underlying NFA subset as a caption, which
//      helps the reader connect D-state to the NFA pane on the left.
//   4. Tracks a step-over-step diff (`newStates`/`newEdges`) so newly-added
//      structure reads with the coral accent — same language the rest of
//      regex-viz uses for "this step's attention".
//
// Colors wired to the site's CSS variables so the graph tracks light/dark
// theme without extra JS. Focus/new accent reuses --code-inline-fg so the
// highlighted subset matches inline code pills elsewhere in prose.
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/DfaGraph.tsx).

import { useMemo } from "react";
import dagre from "dagre";

import type { DfaState, DfaTransition } from "./construction";

const NODE_R = 22;
const NODE_D = NODE_R * 2;

type Point = { x: number; y: number };
type LaidOutEdge = {
  from: number;
  to: number;
  label: string;
  points: Point[];
};

export type DfaGraphProps = {
  states: DfaState[];
  transitions: DfaTransition[];
  /** When set, this node is outlined in the focus color. */
  focus?: number | null;
  /** D-state ids that didn't exist in the previous step. Rendered with a
   *  coral inner ring so the reader can tell "just introduced" from
   *  "still here from before". */
  newStates?: Set<number>;
  /** Transition keys (`${from}-${to}-${label}`) added this step. Coral
   *  stroke + label. */
  newEdges?: Set<string>;
  /** Show the NFA subset beneath each D-node label (default: true). */
  showSubset?: boolean;
  className?: string;
};

export function DfaGraph({
  states,
  transitions,
  focus = null,
  newStates,
  newEdges,
  showSubset = true,
  className,
}: DfaGraphProps) {
  const layout = useMemo(
    () => computeLayout(states, transitions),
    [states, transitions],
  );
  const newStateSet = newStates ?? new Set<number>();
  const newEdgeSet = newEdges ?? new Set<string>();

  // Empty-state placeholder. dagre on a 0-node graph returns 0×0, which
  // collapses to an invisible SVG — readers would see the right pane
  // "disappear" at step 0. Neutral message keeps the frame intentional.
  if (states.length === 0) {
    return (
      <svg
        className={className}
        viewBox="0 0 200 80"
        width={200}
        height={80}
        style={{
          maxWidth: "100%",
          height: "auto",
          fontFamily:
            "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
          color: "var(--color-black)",
        }}
      >
        <text
          x={100}
          y={44}
          textAnchor="middle"
          fontSize="13"
          fill="var(--color-muted)"
        >
          (no DFA state yet)
        </text>
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      style={{
        maxWidth: "100%",
        height: "auto",
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "var(--color-black)",
      }}
    >
      <defs>
        <marker
          id="regex-viz-dfa-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        <marker
          id="regex-viz-dfa-arrow-new"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--code-inline-fg)" />
        </marker>
      </defs>

      {layout.edges.map((e, i) => {
        const isNew = newEdgeSet.has(`${e.from}-${e.to}-${e.label}`);
        const mid = midpoint(e.points);
        const strokeColor = isNew
          ? "var(--code-inline-fg)"
          : "currentColor";
        return (
          <g key={i}>
            <path
              d={pointsToPath(e.points)}
              fill="none"
              stroke={strokeColor}
              strokeOpacity={isNew ? 1 : 0.8}
              strokeWidth={isNew ? 1.8 : 1.4}
              markerEnd={`url(#${isNew ? "regex-viz-dfa-arrow-new" : "regex-viz-dfa-arrow"})`}
            />
            <text
              x={mid.x}
              y={mid.y - 5}
              textAnchor="middle"
              fontSize="12"
              fill={strokeColor}
              stroke="var(--color-bg)"
              strokeWidth="3"
              paintOrder="stroke"
              fontWeight={isNew ? 600 : 500}
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {states.map((s) => {
        const n = layout.nodes[s.id];
        if (!n) return null;
        const isFocus = s.id === focus;
        const isNew = newStateSet.has(s.id);
        // Same coral-vs-neutral language as NfaGraph: focus fill tints the
        // node so "this is the D-state under the microscope right now"
        // reads even without the description. New-this-step gets an inner
        // ring so the reader separates "just born" from "existed before
        // this step got to it".
        const fill = isFocus
          ? "var(--code-inline-bg)"
          : s.is_accept
          ? "var(--color-surface)"
          : "var(--color-bg)";
        const stroke =
          isFocus || isNew ? "var(--code-inline-fg)" : "currentColor";
        const strokeW = isFocus || isNew ? 1.8 : 1.4;
        return (
          <g key={s.id}>
            {s.is_accept && (
              <circle
                cx={n.x}
                cy={n.y}
                r={NODE_R + 3}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeOpacity={0.8}
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={NODE_R}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeW}
            />
            {isNew && (
              <circle
                cx={n.x}
                cy={n.y}
                r={NODE_R - 4}
                fill="none"
                stroke="var(--code-inline-fg)"
                strokeWidth={1.2}
                strokeOpacity={0.9}
              />
            )}
            <text
              x={n.x}
              y={n.y + 4}
              textAnchor="middle"
              fontSize="13"
              fontWeight={600}
              fill="currentColor"
            >
              D{s.id}
            </text>
            {showSubset && (
              <text
                x={n.x}
                y={n.y + NODE_R + 14}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-muted)"
              >
                {`{${s.subset.join(",")}}`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function computeLayout(states: DfaState[], transitions: DfaTransition[]) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 64, marginx: 20, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  states.forEach((s) => {
    g.setNode(String(s.id), { width: NODE_D, height: NODE_D });
  });
  transitions.forEach((t, i) => {
    g.setEdge(String(t.from), String(t.to), { label: t.label }, `e${i}`);
  });

  dagre.layout(g);

  const graph = g.graph();
  const width = graph.width ?? 100;
  // Extra vertical slack so the subset caption (below the circle) is not
  // clipped by the viewBox. dagre plans for node height only.
  const height = (graph.height ?? 100) + 18;

  const nodes: Record<number, Point> = {};
  states.forEach((s) => {
    const n = g.node(String(s.id)) as { x: number; y: number };
    nodes[s.id] = { x: n.x, y: n.y };
  });
  const edges: LaidOutEdge[] = transitions.map((t, i) => {
    const e = g.edge(String(t.from), String(t.to), `e${i}`) as {
      points: Point[];
    };
    return { from: t.from, to: t.to, label: t.label, points: e.points ?? [] };
  });

  return { nodes, edges, width, height };
}

function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  const [first, ...rest] = pts;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

function midpoint(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  return pts[Math.floor(pts.length / 2)];
}

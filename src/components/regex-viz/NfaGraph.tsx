"use client";

// NfaGraph — dagre computes layout, SVG is rendered by hand.
// Colors wired to the site's CSS variables so the graph tracks light/dark
// theme without extra JS. Active-state accent reuses --code-inline-fg so the
// scrubbed highlight matches inline code pills elsewhere in the prose.
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/NfaGraph.tsx).

import { useMemo } from "react";
import dagre from "dagre";

import { EPSILON, type Nfa } from "./trace";

const NODE_R = 18;
const NODE_D = NODE_R * 2;

type Point = { x: number; y: number };
type LaidOutEdge = {
  from: number;
  to: number;
  label: string;
  points: Point[];
};

export type NfaGraphProps = {
  nfa: Nfa;
  active?: number[];
  /**
   * Nodes newly "salient" this step:
   *   - run trace: states that entered the active set since the previous
   *     step (i.e. `active ∖ prev.active`).
   *   - build trace: states that didn't exist in the previous snapshot
   *     (i.e. `nfa.states ∖ prev.nfa.states`).
   *
   * Rendered with an additional coral inner ring so "what changed this
   * frame" reads at a glance. Critical when ε-closure loopbacks produce
   * consecutive identical active sets, or when the accumulated build
   * snapshot is large and most of the picture is carry-over structure.
   */
  entered?: number[];
  /**
   * Transition keys (`${from}-${to}-${label}`) newly added this step.
   * Build traces only — in run traces the NFA is immutable so this is
   * always empty. Matching edges render with the coral accent instead of
   * the default muted/literal palette.
   */
  newEdges?: Set<string>;
  className?: string;
};

export function NfaGraph({
  nfa,
  active = [],
  entered = [],
  newEdges,
  className,
}: NfaGraphProps) {
  const layout = useMemo(() => computeLayout(nfa), [nfa]);
  const activeSet = new Set(active);
  const enteredSet = new Set(entered);
  const newEdgeSet = newEdges ?? new Set<string>();

  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width={layout.width}
      height={layout.height}
      style={{
        maxWidth: "100%",
        height: "auto",
        // Body sans already resolves to the CodeNewRoman mono stack, but
        // force monospace here to keep single-char state ids aligned.
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "var(--color-black)",
      }}
    >
      <defs>
        <marker
          id="regex-viz-arrow"
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
          id="regex-viz-arrow-eps"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-muted)" />
        </marker>
        <marker
          id="regex-viz-arrow-new"
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
        const isEps = e.label === EPSILON;
        const isNew = newEdgeSet.has(`${e.from}-${e.to}-${e.label}`);
        const mid = midpoint(e.points);
        const strokeColor = isNew
          ? "var(--code-inline-fg)"
          : isEps
          ? "var(--color-muted)"
          : "currentColor";
        const markerId = isNew
          ? "regex-viz-arrow-new"
          : isEps
          ? "regex-viz-arrow-eps"
          : "regex-viz-arrow";
        return (
          <g key={i}>
            <path
              d={pointsToPath(e.points)}
              fill="none"
              stroke={strokeColor}
              strokeOpacity={isNew ? 1 : isEps ? 0.7 : 0.8}
              strokeWidth={isNew ? 1.8 : 1.4}
              strokeDasharray={isEps ? "4 3" : undefined}
              markerEnd={`url(#${markerId})`}
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
              fontWeight={isNew ? 600 : 400}
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {layout.nodes.map((n) => {
        const isStart = n.id === nfa.start;
        const isAccept = n.id === nfa.accept;
        const isActive = activeSet.has(n.id);
        const isEntered = enteredSet.has(n.id);
        // Coral accent tracks two distinct "things worth noticing":
        //   - fill (tinted bg) means "currently active" (run traces)
        //   - stroke (outer + optional inner ring) means "salient this
        //     step" — either newly entered active (run) or newly added
        //     structure (build). Both traces agree on "coral = attention
        //     for this frame's delta", just indexed by different sets.
        const fill = isActive
          ? "var(--code-inline-bg)"
          : isStart
          ? "var(--color-surface)"
          : "var(--color-bg)";
        const stroke =
          isActive || isEntered ? "var(--code-inline-fg)" : "currentColor";
        const strokeW = isActive || isEntered ? 1.8 : 1.4;
        return (
          <g key={n.id}>
            {isAccept && (
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
            {/* Inner ring marks "arrived this step". Carry-over active
                nodes get the coral stroke but no inner ring, so the
                reader can separate "still here from last frame" from
                "newly computed this frame". Empty-delta frames show
                zero inner rings — that alone tells the reader the
                scrub did advance but the closure is idempotent under
                this input (or this AST node added no new states). */}
            {isEntered && (
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
              fontWeight={500}
              fill="currentColor"
            >
              {n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function computeLayout(nfa: Nfa) {
  // dagre's multigraph edge key + `g.edge(v, w, name)` 3-arg lookup is
  // required because parallel ε-edges (e.g. the 4 ε-edges of alternation)
  // need distinct keys — otherwise the second setEdge overwrites the first.
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "LR", nodesep: 24, ranksep: 48, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));

  nfa.states.forEach((s) => {
    g.setNode(String(s), { width: NODE_D, height: NODE_D });
  });
  nfa.transitions.forEach((t, i) => {
    g.setEdge(String(t.from), String(t.to), { label: t.label }, `e${i}`);
  });

  dagre.layout(g);

  const graph = g.graph();
  const width = graph.width ?? 100;
  const height = graph.height ?? 100;

  const nodes = nfa.states.map((s) => {
    const n = g.node(String(s)) as { x: number; y: number };
    return { id: s, x: n.x, y: n.y };
  });
  const edges: LaidOutEdge[] = nfa.transitions.map((t, i) => {
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

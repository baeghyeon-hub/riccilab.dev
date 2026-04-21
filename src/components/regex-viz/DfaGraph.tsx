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
  /** Stage 5: per-node fill override. Takes precedence over focus /
   *  accept / default fill. MinimizationViewer uses this to color nodes
   *  by the partition block they currently belong to. */
  blockFill?: Record<number, string>;
  /** Stage 5: D-state ids that should get a thick coral outline without
   *  changing fill. Used to mark the splitter block's members.
   *  Stackable with `blockFill` — a splitter-block node shows its block
   *  color AND a thick outline. */
  outlineIds?: number[];
  /** Stage 5: if set, the node with this id is rendered as the implicit
   *  sink — dashed outline, muted fill, `∅` label, no caption.
   *  MinimizationViewer uses this on both panes: on the left pane, the
   *  totalized sink is shown so the blocks look complete; on the right
   *  pane, the sink block (if present) is marked so the reader knows
   *  that node is "the dead state" of the minimized DFA. */
  sinkId?: number | null;
  /** Stage 5: custom caption renderer beneath each D-node label. Falls
   *  back to `{subset.join(",")}` when absent. Return empty string to
   *  hide the caption (Stage 5 left pane suppresses captions since the
   *  block color already carries the "which group" signal). */
  subsetLabel?: (state: DfaState) => string;
  className?: string;
};

export function DfaGraph({
  states,
  transitions,
  focus = null,
  newStates,
  newEdges,
  showSubset = true,
  blockFill,
  outlineIds,
  sinkId = null,
  subsetLabel,
  className,
}: DfaGraphProps) {
  const layout = useMemo(
    () => computeLayout(states, transitions),
    [states, transitions],
  );
  const newStateSet = newStates ?? new Set<number>();
  const newEdgeSet = newEdges ?? new Set<string>();
  const outlineSet = outlineIds ? new Set(outlineIds) : null;

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
        // Edges touching the sink (Stage 5 totalization) are the
        // synthetic "missing transition → sink" fills — rendering them
        // solid would swamp the real transitions visually. Dash + lower
        // opacity pushes them to the background so the reader's eye
        // stays on the real structure.
        const touchesSink =
          sinkId != null && (e.from === sinkId || e.to === sinkId);
        const mid = midpoint(e.points);
        const strokeColor = isNew
          ? "var(--code-inline-fg)"
          : touchesSink
          ? "var(--color-muted)"
          : "currentColor";
        return (
          <g key={i}>
            <path
              d={pointsToPath(e.points)}
              fill="none"
              stroke={strokeColor}
              strokeOpacity={isNew ? 1 : touchesSink ? 0.45 : 0.8}
              strokeWidth={isNew ? 1.8 : 1.4}
              strokeDasharray={touchesSink ? "3 3" : undefined}
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
              opacity={touchesSink ? 0.55 : 1}
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
        const isSink = sinkId != null && s.id === sinkId;
        const isOutlined = outlineSet != null && outlineSet.has(s.id);
        const blockColor = blockFill?.[s.id];

        // Fill precedence:
        //   sink      → surface (muted, distinct from bg via dashed stroke)
        //   blockFill → palette color (Stage 5 partition coloring)
        //   focus     → coral bg (Stage 3/4 "this step's attention")
        //   accept    → surface
        //   default   → bg
        const fill = isSink
          ? "var(--color-surface)"
          : blockColor
          ? blockColor
          : isFocus
          ? "var(--code-inline-bg)"
          : s.is_accept
          ? "var(--color-surface)"
          : "var(--color-bg)";

        // Stroke precedence:
        //   sink         → muted grey + dashed
        //   outlined     → coral, thick (Stage 5 splitter block)
        //   focus or new → coral, medium (Stage 3/4 attention)
        //   default      → currentColor
        const stroke = isSink
          ? "var(--color-muted)"
          : isOutlined || isFocus || isNew
          ? "var(--code-inline-fg)"
          : "currentColor";
        const strokeW = isOutlined ? 2.5 : isFocus || isNew ? 1.8 : 1.4;

        // Caption: subsetLabel overrides default `{subset}`. Sink always
        // hides its caption (the synthetic sink has no underlying NFA
        // subset, and any real dead states absorbed into it are not
        // pedagogically interesting at this granularity).
        const caption = isSink
          ? ""
          : subsetLabel
          ? subsetLabel(s)
          : `{${s.subset.join(",")}}`;
        const showCaption = showSubset && caption.length > 0;

        return (
          <g key={s.id}>
            {s.is_accept && !isSink && (
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
              strokeDasharray={isSink ? "4 3" : undefined}
            />
            {isNew && !isSink && (
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
              fill={isSink ? "var(--color-muted)" : "currentColor"}
            >
              {isSink ? "∅" : `D${s.id}`}
            </text>
            {showCaption && (
              <text
                x={n.x}
                y={n.y + NODE_R + 14}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-muted)"
              >
                {caption}
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

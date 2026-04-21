"use client";

// MinimizationViewer — Stage 5 viewer for Hopcroft DFA minimization.
// Left pane: the source DFA (from Stage 3) plus a dashed synthetic sink,
// with every state colored by the partition block it currently belongs
// to. The splitter block's members get a thick coral outline. Right
// pane: the final minimized DFA (static across all steps — it is the
// "destination" that the left pane's blocks collapse into).
//
// The shared slider walks through each (splitter, symbol) pair that
// caused a block to split. Steps that didn't cause a split are not
// emitted by the Rust side, so the slider only stops on interesting
// frames. The first frame is the initial {accept} | {non-accept}
// partition and the last is the fixed-point verdict.
//
// Visual language consistent with the other viewers:
//   - coral (thick outline) = splitter block, "this step's attention"
//   - pastel palette        = per-block identity; smallest-element
//                             keying means a split preserves the
//                             surviving half's color and only the new
//                             half picks up a fresh slot
//   - dashed grey           = synthetic sink and totalization edges
//   - green terminal border = fixed point reached (DONE verdict)
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/MinimizationViewer.tsx).

import { useMemo, useState } from "react";

import type { DfaState, DfaTransition } from "./construction";
import { DfaGraph } from "./DfaGraph";
import type { MinimizationTrace } from "./minimization";

export type MinimizationViewerProps = {
  trace: MinimizationTrace;
  className?: string;
};

// Block palette — 8 CSS variable names cycling by smallest-element.
// Defined in globals.css with light pastels for light mode and low-
// alpha saturated tints for dark mode, so both themes read.
const PALETTE = [
  "var(--block-0)",
  "var(--block-1)",
  "var(--block-2)",
  "var(--block-3)",
  "var(--block-4)",
  "var(--block-5)",
  "var(--block-6)",
  "var(--block-7)",
];

function colorForSmallest(smallest: number): string {
  return PALETTE[smallest % PALETTE.length];
}

export function MinimizationViewer({
  trace,
  className,
}: MinimizationViewerProps) {
  const [i, setI] = useState(0);
  const last = trace.steps.length - 1;
  const clamped = Math.min(i, last);
  const step = trace.steps[clamped];
  const scrubbable = trace.steps.length > 1;

  // Totalized source-DFA view: original states + synthetic sink + the
  // original transitions + every missing (state, symbol) filled with a
  // transition to the sink. This is what Hopcroft actually operates on,
  // so showing it lets the "block" colors on the left pane read as
  // complete groupings rather than partial ones.
  const totalized = useMemo(() => totalize(trace), [trace]);

  // Per-node fill color: look up each node's block in the current
  // partition, color by that block's smallest element. Memoized because
  // it's computed per frame but cheap; the memo just keeps re-renders
  // downstream of DfaGraph stable.
  const blockFill = useMemo(() => {
    const fill: Record<number, string> = {};
    for (const block of step.partition) {
      const color = colorForSmallest(block[0]);
      for (const id of block) {
        fill[id] = color;
      }
    }
    return fill;
  }, [step.partition]);

  const splitterOutline = step.splitter_block ?? [];
  const isTerminal = clamped === last;

  // Compact Δ — non-null when this step caused blocks to split. Sits
  // next to the step counter. At init/verdict both splitter_block and
  // split are null so nothing shows.
  const deltaLabel = step.split
    ? `+${Math.max(1, countSplits(step))} split`
    : null;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "stretch",
        padding: 16,
        border:
          "1px solid " +
          (isTerminal
            ? "var(--code-match-border)"
            : "var(--color-border)"),
        borderRadius: 8,
        background: "var(--color-surface)",
        color: "var(--color-black)",
        transition: "border-color 0.15s",
      }}
    >
      <Header
        regex={trace.regex}
        alphabet={trace.alphabet}
        sourceCount={trace.source_dfa_states.length}
        minimizedVisible={visibleCount(trace)}
      />

      {/* Two panes — stack on mobile so each dagre graph gets full column
          width; side by side from sm+. */}
      <div
        className="grid gap-3 grid-cols-1 sm:grid-cols-2"
        style={{ alignItems: "start" }}
      >
        <Pane label="source DFA (totalized, colored by block)">
          <DfaGraph
            states={totalized.states}
            transitions={totalized.transitions}
            blockFill={blockFill}
            outlineIds={splitterOutline}
            sinkId={trace.sink_id}
            subsetLabel={() => ""}
          />
        </Pane>
        <Pane label="minimized DFA (destination)">
          <DfaGraph
            states={minimizedAsSourceShape(trace)}
            transitions={trace.minimized.transitions}
            subsetLabel={(s) =>
              // Show which source ids collapsed into this minimized
              // state. Skip sink: the dashed style + ∅ label carry
              // "this is the dead state" already.
              trace.minimized.states[s.id].is_sink
                ? ""
                : `{${trace.minimized.states[s.id].block.join(",")}}`
            }
            sinkId={trace.minimized.sink_block}
          />
        </Pane>
      </div>

      <PartitionSnapshot
        partition={step.partition}
        splitter={step.splitter_block}
        sinkId={trace.sink_id}
      />

      {scrubbable && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => setI(Math.max(0, clamped - 1))}
            disabled={clamped === 0}
            aria-label="previous step"
            style={stepButtonStyle}
          >
            ◀
          </button>
          <input
            type="range"
            min={0}
            max={last}
            value={clamped}
            onChange={(e) => setI(Number(e.target.value))}
            style={{
              flex: 1,
              accentColor: "var(--code-inline-fg)",
              cursor: "pointer",
            }}
            aria-label="step"
          />
          <button
            type="button"
            onClick={() => setI(Math.min(last, clamped + 1))}
            disabled={clamped === last}
            aria-label="next step"
            style={stepButtonStyle}
          >
            ▶
          </button>
        </div>
      )}

      {/* Responsive status bar — same pattern as TraceViewer /
          ComparisonViewer. Description gets its own line on mobile so
          the middle flex-1 column doesn't collapse. */}
      <div
        className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        style={{
          fontFamily:
            "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          color: "var(--color-muted)",
          letterSpacing: "0.02em",
        }}
      >
        <span className="order-2 sm:order-none flex items-center gap-2">
          step {clamped + 1} / {trace.steps.length}
          {deltaLabel && (
            <span
              style={{
                color: "var(--code-inline-fg)",
                background: "var(--code-inline-bg)",
                border: "1px solid var(--code-inline-border, transparent)",
                borderRadius: 3,
                padding: "1px 5px",
                fontSize: 11,
              }}
            >
              {deltaLabel}
            </span>
          )}
        </span>
        <span
          className="order-1 sm:order-none sm:flex-1 text-center break-words"
          style={{ color: "var(--color-black)" }}
        >
          {step.description}
        </span>
        <span className="order-3 sm:order-none flex items-center justify-end gap-2">
          {isTerminal && (
            <span style={verdictBadgeStyle("match")}>✓ DONE</span>
          )}
          <span>
            {step.partition.length} block
            {step.partition.length === 1 ? "" : "s"}
          </span>
        </span>
      </div>
    </div>
  );
}

function Header({
  regex,
  alphabet,
  sourceCount,
  minimizedVisible,
}: {
  regex: string;
  alphabet: string[];
  sourceCount: number;
  minimizedVisible: number;
}) {
  return (
    <div
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      style={{
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 13,
        color: "var(--color-muted)",
      }}
    >
      <span>
        regex: <InlineCode>{regex}</InlineCode>
      </span>
      <span>Σ = {`{${alphabet.join(",")}}`}</span>
      <span>
        <span style={{ color: "var(--color-black)", fontWeight: 600 }}>
          {sourceCount}
        </span>{" "}
        →{" "}
        <span
          style={{ color: "var(--code-match-fg)", fontWeight: 600 }}
        >
          {minimizedVisible}
        </span>{" "}
        state{minimizedVisible === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        color: "var(--code-inline-fg)",
        background: "var(--code-inline-bg)",
        border: "1px solid var(--code-inline-border)",
        borderRadius: 3,
        padding: "0 5px",
        fontFamily: "inherit",
      }}
    >
      {children}
    </code>
  );
}

function Pane({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          fontFamily:
            "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          color: "var(--color-muted)",
          textAlign: "center",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 12,
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PartitionSnapshot({
  partition,
  splitter,
  sinkId,
}: {
  partition: number[][];
  splitter: number[] | null;
  sinkId: number;
}) {
  const splitterKey = splitter ? splitter.join(",") : null;
  return (
    <div
      style={{
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {partition.map((block, i) => {
        const isSplitter = block.join(",") === splitterKey;
        return (
          <span
            key={i}
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: colorForSmallest(block[0]),
              color: "var(--color-black)",
              border:
                "1px solid " +
                (isSplitter
                  ? "var(--code-inline-fg)"
                  : "var(--color-border)"),
              boxShadow: isSplitter
                ? "0 0 0 1px var(--code-inline-fg)"
                : undefined,
            }}
          >
            {"{"}
            {block.map((id) => (id === sinkId ? "∅" : `D${id}`)).join(",")}
            {"}"}
          </span>
        );
      })}
    </div>
  );
}

// Verdict pill — same shape as TraceViewer / ConstructionViewer. Only
// the "match" branch is reachable today (Hopcroft always terminates at
// a fixed point); parameterized for symmetry with the other viewers.
function verdictBadgeStyle(
  kind: "match" | "mismatch",
): React.CSSProperties {
  const prefix = kind === "match" ? "--code-match" : "--code-stuck";
  return {
    color: `var(${prefix}-fg)`,
    background: `var(${prefix}-bg)`,
    border: `1px solid var(${prefix}-border)`,
    borderRadius: 3,
    padding: "1px 6px",
    fontSize: 11,
    letterSpacing: "0.08em",
    fontWeight: 600,
  };
}

// Mono ghost button matching the other viewers.
const stepButtonStyle: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 14,
  fontFamily:
    "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "var(--color-black)",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  cursor: "pointer",
  lineHeight: 1,
};

// ─── Helpers — build view-only derived data from the raw trace ──────

function totalize(trace: MinimizationTrace): {
  states: DfaState[];
  transitions: DfaTransition[];
} {
  const states: DfaState[] = [...trace.source_dfa_states];
  // Add the synthetic sink as a real DfaState for layout purposes. It
  // has no underlying NFA subset; DfaGraph hides the caption for sink.
  states.push({ id: trace.sink_id, subset: [], is_accept: false });

  const transitions: DfaTransition[] = [...trace.source_dfa_transitions];

  // Fill missing (state, symbol) transitions by routing to the sink.
  // Without this the viewer would show blocks whose members are colored
  // identically but "look like" they should be differentiable — the
  // hiding of the sink is a rendering choice, but hiding the TOTALIZED
  // structure breaks the partition-refinement narrative.
  const have = new Set<string>(
    trace.source_dfa_transitions.map((t) => `${t.from}|${t.label}`),
  );
  for (const s of trace.source_dfa_states) {
    for (const c of trace.alphabet) {
      if (!have.has(`${s.id}|${c}`)) {
        transitions.push({ from: s.id, to: trace.sink_id, label: c });
      }
    }
  }
  // Sink self-loops on every symbol.
  for (const c of trace.alphabet) {
    transitions.push({ from: trace.sink_id, to: trace.sink_id, label: c });
  }

  return { states, transitions };
}

// The right pane's DfaGraph expects DfaState[] with subset/is_accept.
// The minimized side stores `block` instead of `subset`. Adapt: use
// `block` as the subset caption via `subsetLabel`.
function minimizedAsSourceShape(trace: MinimizationTrace): DfaState[] {
  return trace.minimized.states.map((s) => ({
    id: s.id,
    subset: s.block,
    is_accept: s.is_accept,
  }));
}

function visibleCount(trace: MinimizationTrace): number {
  // If the sink block contains only the synthetic sink, hide it from
  // the count. If real source states were absorbed into the sink block
  // (dead states in the source DFA), the whole block is still one
  // minimized state and we count it.
  const sink = trace.minimized.states[trace.minimized.sink_block];
  return sink.block.length === 1 && sink.block[0] === trace.sink_id
    ? trace.minimized.states.length - 1
    : trace.minimized.states.length;
}

// Returns how many blocks this step split. At least 1 when `split` is
// non-null (that's the semantic of emitting a step at all), but a
// single (splitter, symbol) pair can split multiple blocks at once.
// We approximate by counting blocks in the current partition that
// contain child_in or child_out — crude, but the diff is cosmetic.
function countSplits(step: { split: { child_in: number[]; child_out: number[] } | null; partition: number[][] }): number {
  if (!step.split) return 0;
  const { child_in, child_out } = step.split;
  const key = (a: number[]) => a.join(",");
  const blockKeys = new Set(step.partition.map(key));
  // 1 if both halves are present as current blocks (the canonical case).
  const bothPresent =
    blockKeys.has(key(child_in)) && blockKeys.has(key(child_out));
  return bothPresent ? 1 : 0;
}

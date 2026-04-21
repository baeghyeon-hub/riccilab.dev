"use client";

// ComparisonViewer — two-pane NFA-vs-DFA simulator on the same input.
// Left pane: the source NFA with `nfa_active` highlighted. Right pane:
// the full DFA with `dfa_current` outlined. One slider drives both.
//
// Stage 4 sibling of TraceViewer (single engine) and ConstructionViewer
// (NFA + growing DFA, no input). Separate component because the payload
// shape is genuinely different — merging them would mean branching on
// shape at every render.
//
// Visual language matches the other two viewers:
//   - coral = "this step's attention" (active / current / newly-entered)
//   - green = final match-agree
//   - dim red = engines disagree (bug in Rust side) or final reject
//   - muted = "reject (agree)" — the common no-match case shouldn't shout
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/ComparisonViewer.tsx).

import { useState } from "react";

import type { ComparisonTrace } from "./comparison";
import { DfaGraph } from "./DfaGraph";
import { NfaGraph } from "./NfaGraph";

export type ComparisonViewerProps = {
  trace: ComparisonTrace;
  className?: string;
};

type Verdict = "match-agree" | "reject-agree" | "disagree";

export function ComparisonViewer({ trace, className }: ComparisonViewerProps) {
  const [i, setI] = useState(0);
  const last = trace.steps.length - 1;
  const clamped = Math.min(i, last);
  const step = trace.steps[clamped];
  const prev = clamped > 0 ? trace.steps[clamped - 1] : null;
  const scrubbable = trace.steps.length > 1;

  // Step-over-step NFA diff — same idea as Stage 2. DFA side has a single
  // current state so `focus` is already sufficient; no need for a diff
  // set there.
  const prevNfaActive = new Set(prev?.nfa_active ?? []);
  const enteredNfa = step.nfa_active.filter((s) => !prevNfaActive.has(s));

  // ─── Outcome ─────────────────────────────────────────────────────────
  // `verdicts_agree` should always be true by construction (the whole
  // point of subset construction is equivalence). We still surface the
  // disagree branch in the UI because if it ever fires, it's a Rust-side
  // bug and silent success would hide it.
  const verdict: Verdict = !trace.summary.verdicts_agree
    ? "disagree"
    : trace.summary.nfa_accepted
    ? "match-agree"
    : "reject-agree";
  const isTerminal = clamped === last;

  // Mid-run stuck cue on the input strip: if an engine's alive set went
  // empty after the previous step's char, that char is what killed it.
  // NFA and DFA can stuck at different positions; we prefer whichever
  // died first so the reader sees the earlier failure.
  const nfaJustStuck =
    step.nfa_active.length === 0 &&
    prev != null &&
    prev.nfa_active.length > 0;
  const dfaJustStuck =
    step.dfa_current == null && prev != null && prev.dfa_current != null;
  const stuckPos =
    (nfaJustStuck || dfaJustStuck) && prev ? prev.input_pos : null;

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
          (isTerminal && verdict === "match-agree"
            ? "var(--code-match-border)"
            : isTerminal && verdict === "disagree"
            ? "var(--code-stuck-border)"
            : "var(--color-border)"),
        borderRadius: 8,
        background: "var(--color-surface)",
        color: "var(--color-black)",
        transition: "border-color 0.15s",
      }}
    >
      <Header regex={trace.regex} input={trace.input} alphabet={trace.alphabet} />

      {/*
        Two panes. On ≥sm side by side (grid 1fr 1fr); below sm they
        stack so each dagre graph gets full column width — NFA + DFA
        squeezed into ~180 px of a phone is unreadable.
      */}
      <div
        className="grid gap-3 grid-cols-1 sm:grid-cols-2"
        style={{ alignItems: "start" }}
      >
        <Pane label="NFA simulator">
          <NfaGraph
            nfa={trace.nfa}
            active={step.nfa_active}
            entered={enteredNfa}
          />
        </Pane>
        <Pane label="DFA simulator">
          <DfaGraph
            states={trace.dfa_states}
            transitions={trace.dfa_transitions}
            focus={step.dfa_current}
          />
        </Pane>
      </div>

      {trace.input.length > 0 && (
        <InputStrip
          input={trace.input}
          pos={step.input_pos}
          stuckPos={stuckPos}
          faded={isTerminal && verdict !== "match-agree"}
        />
      )}

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

      {/*
        Responsive status bar. Mirrors TraceViewer / ConstructionViewer:
        description on top as its own row on mobile (otherwise the middle
        flex-1 column collapses and wraps character-by-character), step
        pinned left and verdict + active-count pinned right on the row
        below. Sm+ collapses to one flex row.
      */}
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
        </span>
        <span
          className="order-1 sm:order-none sm:flex-1 text-center break-words"
          style={{ color: "var(--color-black)" }}
        >
          {step.description}
        </span>
        <span className="order-3 sm:order-none flex items-center justify-end gap-2 flex-wrap">
          {isTerminal && verdict === "match-agree" && (
            <span style={verdictBadgeStyle("match")}>✓ MATCH</span>
          )}
          {isTerminal && verdict === "reject-agree" && (
            <span style={verdictBadgeStyle("reject")}>✗ NO MATCH</span>
          )}
          {isTerminal && verdict === "disagree" && (
            <span style={verdictBadgeStyle("disagree")}>⚠ DISAGREE</span>
          )}
          <span>
            NFA {step.nfa_active.length}s · DFA{" "}
            {step.dfa_current == null ? "∅" : `D${step.dfa_current}`}
          </span>
        </span>
      </div>
    </div>
  );
}

// Verdict pill. Three cases here vs TraceViewer's two:
//   match   — final accept on both engines (green, attention-grabbing)
//   reject  — final reject on both (muted grey — no-match is common,
//             shouldn't shout)
//   disagree — summary.verdicts_agree === false. Construction is
//             equivalence-preserving by proof, so this only fires if the
//             Rust side has a bug. We render it loud so it's impossible
//             to miss if it ever surfaces in prod.
function verdictBadgeStyle(
  kind: "match" | "reject" | "disagree",
): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 3,
    padding: "1px 6px",
    fontSize: 11,
    letterSpacing: "0.08em",
    fontWeight: 600,
    border: "1px solid",
  };
  if (kind === "match") {
    return {
      ...base,
      color: "var(--code-match-fg)",
      background: "var(--code-match-bg)",
      borderColor: "var(--code-match-border)",
    };
  }
  if (kind === "disagree") {
    return {
      ...base,
      color: "var(--code-stuck-fg)",
      background: "var(--code-stuck-bg)",
      borderColor: "var(--code-stuck-border)",
    };
  }
  // reject-agree: no-match happened, but both engines agreed, so this is
  // the correct outcome — tone it down to neutral grey.
  return {
    ...base,
    color: "var(--color-muted)",
    background: "transparent",
    borderColor: "var(--color-border)",
  };
}

function Header({
  regex,
  input,
  alphabet,
}: {
  regex: string;
  input: string;
  alphabet: string[];
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
      <span>
        input: <InlineCode>{JSON.stringify(input)}</InlineCode>
      </span>
      <span>Σ = {`{${alphabet.join(",")}}`}</span>
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

function InputStrip({
  input,
  pos,
  stuckPos,
  faded,
}: {
  input: string;
  pos: number;
  stuckPos: number | null;
  faded: boolean;
}) {
  const chars = Array.from(input);
  return (
    <div
      style={{
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 14,
        textAlign: "center",
        padding: "6px 0",
        opacity: faded ? 0.55 : 1,
      }}
    >
      {chars.map((c, i) => {
        // `pos` points to the character being read NEXT (or past-end at
        // verdict). So active pos is strictly `i === pos` and highlights
        // the char about to be consumed. Stuck char is the one that just
        // killed an engine — priority stuck > active > default.
        const isActive = i === pos;
        const isStuck = i === stuckPos;
        const color = isStuck
          ? "var(--code-stuck-fg)"
          : isActive
          ? "var(--code-inline-fg)"
          : "var(--color-black)";
        const background = isStuck
          ? "var(--code-stuck-bg)"
          : isActive
          ? "var(--code-inline-bg)"
          : "transparent";
        const borderColor = isStuck
          ? "var(--code-stuck-fg)"
          : isActive
          ? "var(--code-inline-fg)"
          : "transparent";
        return (
          <span
            key={i}
            style={{
              padding: "2px 5px",
              margin: "0 1px",
              color,
              background,
              borderBottom: `2px solid ${borderColor}`,
              borderRadius: 3,
              textDecoration: isStuck ? "line-through" : undefined,
              transition: "background 0.1s, color 0.1s",
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

// Mono ghost button matching TraceViewer / ConstructionViewer.
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

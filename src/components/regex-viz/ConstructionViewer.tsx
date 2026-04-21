"use client";

// ConstructionViewer — two-pane viewer for subset-construction traces.
// Left pane: the source NFA, with the current step's `focus_nfa_subset`
// highlighted. Right pane: the DFA built so far, with the current step's
// focus D-state highlighted and structure added this step marked coral.
// One slider drives both.
//
// This is the Stage 3 analogue of TraceViewer: same slider UX, different
// payload. Kept as a separate component because the shape (`ConstructionTrace`
// vs `Trace`) is genuinely different — merging them would mean branching on
// shape at every render, which obscures intent.
//
// Styled to match TraceViewer: CSS-variable theming, scrubbable guard when
// there's only one step, responsive status bar (column on mobile, row on
// sm+), and a Δ badge that tells the reader when a frame advanced without
// producing new D-states or transitions ("yes, I clicked next; the subset
// was already in the worklist and this step just closed a transition").
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/ConstructionViewer.tsx).

import { useState } from "react";

import type { ConstructionTrace } from "./construction";
import { DfaGraph } from "./DfaGraph";
import { NfaGraph } from "./NfaGraph";

export type ConstructionViewerProps = {
  trace: ConstructionTrace;
  className?: string;
};

export function ConstructionViewer({ trace, className }: ConstructionViewerProps) {
  const [i, setI] = useState(0);
  const last = trace.steps.length - 1;
  const clamped = Math.min(i, last);
  const step = trace.steps[clamped];
  const prev = clamped > 0 ? trace.steps[clamped - 1] : null;
  const scrubbable = trace.steps.length > 1;

  // ─── Step-over-step diff for the DFA pane ────────────────────────────
  // Same idea as TraceViewer's build-trace diff: the DFA grows by subset,
  // and without a delta cue the reader can't tell "closed a transition
  // back to an already-known D-state" from "nothing happened this step".
  // `newStates` / `newEdges` let DfaGraph render fresh structure in coral
  // while carry-over stays neutral.
  const prevStateIds = new Set(prev?.dfa_states.map((s) => s.id) ?? []);
  const prevEdgeKeys = new Set(
    prev?.dfa_transitions.map((t) => edgeKey(t.from, t.to, t.label)) ?? [],
  );
  const newStates = new Set(
    step.dfa_states.filter((s) => !prevStateIds.has(s.id)).map((s) => s.id),
  );
  const newEdges = new Set(
    step.dfa_transitions
      .map((t) => edgeKey(t.from, t.to, t.label))
      .filter((k) => !prevEdgeKeys.has(k)),
  );

  const deltaLabel = (() => {
    if (!prev) return null;
    return newStates.size + newEdges.size === 0
      ? "Δ 0"
      : `+${newStates.size}D/+${newEdges.size}δ`;
  })();

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "stretch",
        padding: 16,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        background: "var(--color-surface)",
        color: "var(--color-black)",
      }}
    >
      <Header regex={trace.regex} alphabet={trace.alphabet} />

      {/*
        Two panes. On ≥sm they sit side by side (grid 1fr 1fr); below sm
        they stack so each graph gets the full column width — dagre layouts
        squeezed into ~180 px of a narrow phone look like noise.
      */}
      <div
        className="grid gap-3 grid-cols-1 sm:grid-cols-2"
        style={{ alignItems: "start" }}
      >
        <Pane label="NFA (source)">
          <NfaGraph nfa={trace.nfa} active={step.focus_nfa_subset} />
        </Pane>
        <Pane label="DFA (under construction)">
          <DfaGraph
            states={step.dfa_states}
            transitions={step.dfa_transitions}
            focus={step.focus_dfa_state}
            newStates={newStates}
            newEdges={newEdges}
          />
        </Pane>
      </div>

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
        Responsive status bar. Mirrors TraceViewer so both Stage 2 and
        Stage 3 viewers read the same on mobile — description on top as a
        full-width line (otherwise the middle flex-1 collapses and wraps
        character-by-character on narrow screens), step+Δ pinned left and
        D/δ counts pinned right on the row below.
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
          {deltaLabel && (
            <span
              style={{
                color:
                  deltaLabel === "Δ 0"
                    ? "var(--color-muted)"
                    : "var(--code-inline-fg)",
                background:
                  deltaLabel === "Δ 0"
                    ? "transparent"
                    : "var(--code-inline-bg)",
                border:
                  "1px solid " +
                  (deltaLabel === "Δ 0"
                    ? "var(--color-border)"
                    : "var(--code-inline-border, transparent)"),
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
          <span>
            {step.dfa_states.length}D · {step.dfa_transitions.length}δ
          </span>
        </span>
      </div>
    </div>
  );
}

function edgeKey(from: number, to: number, label: string): string {
  return `${from}-${to}-${label}`;
}

function Header({ regex, alphabet }: { regex: string; alphabet: string[] }) {
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
        regex:{" "}
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
          {regex}
        </code>
      </span>
      <span>Σ = {`{${alphabet.join(",")}}`}</span>
    </div>
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

// Mono ghost button: transparent fill, border in theme tokens. Disabled
// state drops opacity rather than recoloring so the affordance stays
// legible against the surface tint. Matches TraceViewer.
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

"use client";

// TraceViewer — step slider + NfaGraph. Works for both Build traces (NFA
// grows, `active` is empty) and Run traces (NFA is fixed, `active` moves).
//
// Colors wired to CSS variables so the viewer reads correctly on both light
// and dark themes. The active-input highlight reuses --code-inline-{fg,bg}
// so the scrubbed character matches inline-code pills elsewhere in prose.
//
// Vendored from github.com/Ricci-curvature/regex-viz (viz/TraceViewer.tsx).

import { useState } from "react";

import { NfaGraph } from "./NfaGraph";
import type { Trace } from "./trace";

export type TraceViewerProps = {
  trace: Trace;
  className?: string;
};

export function TraceViewer({ trace, className }: TraceViewerProps) {
  const [i, setI] = useState(0);
  const last = trace.steps.length - 1;
  const clamped = Math.min(i, last);
  const step = trace.steps[clamped];
  const prev = clamped > 0 ? trace.steps[clamped - 1] : null;
  // A one-step trace (e.g. a single literal) has nothing to scrub through.
  // Hiding the control row avoids shipping an interactive-looking slider
  // that silently refuses input — cleaner than a disabled-looking stub.
  const scrubbable = trace.steps.length > 1;

  // ─── Step-over-step diff ────────────────────────────────────────────
  // Without an explicit diff, consecutive frames can look identical —
  // ε-closure loopbacks in run traces produce the same active set for
  // two chars in a row, and build traces re-render the full accumulated
  // NFA every frame so 80% of the picture is carry-over. The reader has
  // no way to tell "intended no-op" from "viewer didn't update".
  //
  // Two semantics unified under one `entered` set:
  //   - run trace  → states that newly joined the active set
  //   - build trace → states that didn't exist in the previous snapshot
  // Plus `newEdges` (build only), where new transitions get the coral
  // accent. Empty-delta frames show zero inner rings and a "Δ 0" badge,
  // which is the correct signal that the scrub did advance.
  const prevActiveSet = new Set(prev?.active ?? []);
  const prevStateSet = new Set(prev?.nfa.states ?? []);
  const prevEdgeKeys = new Set(
    prev?.nfa.transitions.map((t) => edgeKey(t.from, t.to, t.label)) ?? []
  );
  const currActiveSet = new Set(step.active);

  const enteredNodes =
    trace.kind === "run"
      ? step.active.filter((s) => !prevActiveSet.has(s))
      : step.nfa.states.filter((s) => !prevStateSet.has(s));
  const exitedCount =
    trace.kind === "run"
      ? [...prevActiveSet].filter((s) => !currActiveSet.has(s)).length
      : 0;
  const newEdgeSet = new Set(
    step.nfa.transitions
      .map((t) => edgeKey(t.from, t.to, t.label))
      .filter((k) => !prevEdgeKeys.has(k))
  );

  // Δ label: for run, nodes-only since edges never change. For build,
  // show both state and transition deltas since either can be zero.
  const deltaLabel = (() => {
    if (!prev) return null;
    if (trace.kind === "run") {
      return enteredNodes.length + exitedCount === 0
        ? "Δ 0"
        : `Δ +${enteredNodes.length}/−${exitedCount}`;
    }
    return enteredNodes.length + newEdgeSet.size === 0
      ? "Δ 0"
      : `+${enteredNodes.length}s/+${newEdgeSet.size}t`;
  })();

  // ─── Outcome detection (run traces only) ────────────────────────────
  // Three failure/success modes the reader needs to distinguish:
  //   - stuck: active set went empty mid-input (no transition on the
  //     char just consumed). The char at the previous step's input_pos
  //     is the one that killed the match.
  //   - final match: reached last step and accept state is active.
  //   - final mismatch: reached last step but accept is not active.
  // Without these cues, empty-active frames look identical to "viewer
  // broken" and the terminal step's verdict is buried in description text.
  const isStuck =
    trace.kind === "run" &&
    step.active.length === 0 &&
    prev != null &&
    prev.active.length > 0;
  const stuckPos = isStuck ? prev?.input_pos ?? null : null;
  const isTerminal = clamped === last;
  const descLower = step.description.toLowerCase();
  const verdict: "match" | "mismatch" | null =
    isTerminal && trace.kind === "run"
      ? descLower.startsWith("match")
        ? "match"
        : descLower.startsWith("mismatch") || descLower.startsWith("no match")
        ? "mismatch"
        : null
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
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        background: "var(--color-surface)",
        color: "var(--color-black)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 12,
          background: "var(--color-bg)",
          // Border hue doubles as a status ring: stuck → dim red, final
          // match → green, default → neutral border. Border alone (no
          // fill change) keeps the graph itself readable.
          border:
            "1px solid " +
            (isStuck || verdict === "mismatch"
              ? "var(--code-stuck-border)"
              : verdict === "match"
              ? "var(--code-match-border)"
              : "var(--color-border)"),
          borderRadius: 6,
          transition: "border-color 0.15s",
        }}
      >
        <NfaGraph
          nfa={step.nfa}
          active={step.active}
          entered={enteredNodes}
          newEdges={newEdgeSet}
        />
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

      <div
        style={{
          fontFamily:
            "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          color: "var(--color-muted)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          step {clamped + 1} / {trace.steps.length}
          {deltaLabel && (
            <span
              style={{
                // Coral tint when there IS a delta, muted when Δ 0 —
                // "something happened" vs "math says nothing changed".
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
          style={{
            flex: 1,
            textAlign: "center",
            color: "var(--color-black)",
          }}
        >
          {step.description}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {verdict === "match" && (
            <span style={verdictBadgeStyle("match")}>✓ MATCH</span>
          )}
          {verdict === "mismatch" && (
            <span style={verdictBadgeStyle("mismatch")}>✗ NO MATCH</span>
          )}
          <span>
            {step.nfa.states.length}s · {step.nfa.transitions.length}t
          </span>
        </span>
      </div>

      {trace.kind === "run" && trace.input != null && (
        <InputStrip
          input={trace.input}
          pos={step.input_pos}
          stuckPos={stuckPos}
          faded={verdict === "mismatch"}
        />
      )}
    </div>
  );
}

// Stable key for a transition — same format used by both the step-over-
// step diff here and the `newEdges` lookup inside NfaGraph. Ties them
// together so we only compute the string once per edge per render.
function edgeKey(from: number, to: number, label: string): string {
  return `${from}-${to}-${label}`;
}

// Verdict pill. Uses the stuck/match tokens defined in globals.css so
// both modes get themed automatically. Kept as a function so the two
// callsites stay declarative (MATCH vs NO MATCH share 95% of the style).
function verdictBadgeStyle(kind: "match" | "mismatch"): React.CSSProperties {
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

// Mono ghost button: transparent fill, border in theme tokens. Disabled
// state drops opacity rather than recoloring so the affordance stays legible
// against the surface tint.
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

function InputStrip({
  input,
  pos,
  stuckPos,
  faded,
}: {
  input: string;
  pos: number | null;
  /** Index of the character whose consumption killed the match. */
  stuckPos?: number | null;
  /** Dim the whole strip when the run ended in a final mismatch. */
  faded?: boolean;
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
        const isActive = i === pos;
        const isStuck = i === stuckPos;
        // Three states per char, priority stuck > active > default.
        // Stuck char gets the dim-red token plus a line-through so the
        // reader sees "this is the character that broke the match",
        // even without the description text.
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

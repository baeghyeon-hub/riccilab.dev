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
          border: "1px solid var(--color-border)",
          borderRadius: 6,
        }}
      >
        <NfaGraph nfa={step.nfa} active={step.active} />
      </div>

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
        <span>
          step {clamped + 1} / {trace.steps.length}
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
        <span>
          {step.nfa.states.length}s · {step.nfa.transitions.length}t
        </span>
      </div>

      {trace.kind === "run" && trace.input != null && (
        <InputStrip input={trace.input} pos={step.input_pos} />
      )}
    </div>
  );
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

function InputStrip({ input, pos }: { input: string; pos: number | null }) {
  const chars = Array.from(input);
  return (
    <div
      style={{
        fontFamily:
          "var(--font-sans), ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 14,
        textAlign: "center",
        padding: "6px 0",
      }}
    >
      {chars.map((c, i) => {
        const isActive = i === pos;
        return (
          <span
            key={i}
            style={{
              padding: "2px 5px",
              margin: "0 1px",
              color: isActive ? "var(--code-inline-fg)" : "var(--color-black)",
              background: isActive ? "var(--code-inline-bg)" : "transparent",
              borderBottom: isActive
                ? "2px solid var(--code-inline-fg)"
                : "2px solid transparent",
              borderRadius: 3,
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

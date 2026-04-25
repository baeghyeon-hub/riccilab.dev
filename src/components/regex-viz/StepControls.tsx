"use client";

import type { CSSProperties } from "react";

export type StepControlsProps = {
  current: number;
  last: number;
  onStepChange: (step: number) => void;
};

export function StepControls({
  current,
  last,
  onStepChange,
}: StepControlsProps) {
  return (
    <div style={stepControlsStyle}>
      <button
        type="button"
        onClick={() => onStepChange(Math.max(0, current - 1))}
        disabled={current === 0}
        aria-label="previous step"
        style={stepButtonStyle}
      >
        ◀
      </button>
      <input
        type="range"
        min={0}
        max={last}
        value={current}
        onChange={(event) => onStepChange(Number(event.target.value))}
        style={stepRangeStyle}
        aria-label="step"
      />
      <button
        type="button"
        onClick={() => onStepChange(Math.min(last, current + 1))}
        disabled={current === last}
        aria-label="next step"
        style={stepButtonStyle}
      >
        ▶
      </button>
    </div>
  );
}

const stepControlsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

// Mono ghost button shared by the regex-viz timeline viewers.
const stepButtonStyle: CSSProperties = {
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

const stepRangeStyle: CSSProperties = {
  flex: 1,
  accentColor: "var(--code-inline-fg)",
  cursor: "pointer",
};

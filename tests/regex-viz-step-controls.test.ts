import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  Children,
  isValidElement,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { StepControls } from "../src/components/regex-viz/StepControls";

function renderStepControls(current: number, last: number) {
  const calls: number[] = [];
  const element = StepControls({
    current,
    last,
    onStepChange: (step) => calls.push(step),
  });

  assert.ok(isValidElement(element));

  const children = Children.toArray(
    (element as ReactElement<{ children?: ReactNode }>).props.children,
  );

  return { calls, children };
}

test("StepControls preserves the shared slider semantics", () => {
  const { calls, children } = renderStepControls(1, 2);
  const [previous, range, next] = children;

  assert.ok(isValidElement(previous));
  assert.ok(isValidElement(range));
  assert.ok(isValidElement(next));

  const previousButton =
    previous as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  const rangeInput =
    range as ReactElement<InputHTMLAttributes<HTMLInputElement>>;
  const nextButton =
    next as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;

  assert.equal(previousButton.props.type, "button");
  assert.equal(previousButton.props["aria-label"], "previous step");
  previousButton.props.onClick?.(
    {} as MouseEvent<HTMLButtonElement>,
  );
  assert.deepEqual(calls, [0]);

  assert.equal(rangeInput.props.type, "range");
  assert.equal(rangeInput.props.min, 0);
  assert.equal(rangeInput.props.max, 2);
  assert.equal(rangeInput.props.value, 1);
  assert.equal(rangeInput.props["aria-label"], "step");
  rangeInput.props.onChange?.({
    target: { value: "2" },
  } as ChangeEvent<HTMLInputElement>);
  assert.deepEqual(calls, [0, 2]);

  assert.equal(nextButton.props.type, "button");
  assert.equal(nextButton.props["aria-label"], "next step");
  nextButton.props.onClick?.({} as MouseEvent<HTMLButtonElement>);
  assert.deepEqual(calls, [0, 2, 2]);
});

test("StepControls keeps boundary buttons disabled at the ends", () => {
  const start = renderStepControls(0, 2).children;
  const end = renderStepControls(2, 2).children;

  const startPrevious =
    start[0] as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  const startNext =
    start[2] as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  const endPrevious =
    end[0] as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;
  const endNext =
    end[2] as ReactElement<ButtonHTMLAttributes<HTMLButtonElement>>;

  assert.equal(startPrevious.props.disabled, true);
  assert.equal(startNext.props.disabled, false);
  assert.equal(endPrevious.props.disabled, false);
  assert.equal(endNext.props.disabled, true);
});

test("regex-viz viewers share StepControls instead of local slider copies", () => {
  const viewerFiles = [
    "src/components/regex-viz/ComparisonViewer.tsx",
    "src/components/regex-viz/ConstructionViewer.tsx",
    "src/components/regex-viz/MinimizationViewer.tsx",
    "src/components/regex-viz/TraceViewer.tsx",
  ];

  for (const file of viewerFiles) {
    const source = readFileSync(file, "utf8");

    assert.match(source, /import \{ StepControls \} from "\.\/StepControls";/);
    assert.match(
      source,
      /<StepControls current=\{clamped\} last=\{last\} onStepChange=\{setI\} \/>/,
    );
    assert.doesNotMatch(source, /const stepButtonStyle/);
  }
});

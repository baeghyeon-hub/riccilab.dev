import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  midpoint,
  pointsToPath,
} from "../src/components/regex-viz/graph-geometry";

test("pointsToPath preserves graph SVG path formatting", () => {
  assert.equal(pointsToPath([]), "");
  assert.equal(
    pointsToPath([
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ]),
    "M 1 2 L 3 4 L 5 6",
  );
});

test("midpoint preserves empty and floor-index label placement", () => {
  assert.deepEqual(midpoint([]), { x: 0, y: 0 });
  assert.deepEqual(
    midpoint([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ]),
    { x: 20, y: 20 },
  );
});

test("DFA and NFA graphs share geometry helpers instead of local copies", () => {
  const graphFiles = [
    "src/components/regex-viz/DfaGraph.tsx",
    "src/components/regex-viz/NfaGraph.tsx",
  ];

  for (const file of graphFiles) {
    const source = readFileSync(file, "utf8");

    assert.match(source, /from "\.\/graph-geometry";/);
    assert.doesNotMatch(source, /function pointsToPath/);
    assert.doesNotMatch(source, /function midpoint/);
    assert.doesNotMatch(source, /type Point =/);
    assert.doesNotMatch(source, /type LaidOutEdge =/);
  }
});

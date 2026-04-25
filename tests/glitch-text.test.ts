import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { scrambleReveal, scrambleText } from "../src/lib/glitch-text";

// Math.random stubbing — feed a fixed sequence so each test asserts
// exact output. Returns the restore handle.
function withRandomSequence<T>(values: number[], fn: () => T): T {
  const original = Math.random;
  let i = 0;
  Math.random = () => {
    const v = values[i % values.length];
    i++;
    return v;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test("scrambleText returns input unchanged when intensity is 0", () => {
  // intensity=0 short-circuits before consuming any random values.
  const out = withRandomSequence([0.99], () =>
    scrambleText("RICCILAB", 0, "!@#"),
  );
  assert.equal(out, "RICCILAB");
});

test("scrambleText returns input unchanged when glitchChars is empty", () => {
  const out = scrambleText("RICCILAB", 1, "");
  assert.equal(out, "RICCILAB");
});

test("scrambleText preserves whitespace at every intensity", () => {
  // Force every roll to swap (Math.random() = 0 < any positive intensity).
  // Glitch char picker also lands on index 0 (`!`). Whitespace must
  // pass through untouched even though the swap branch would fire.
  const out = withRandomSequence([0], () =>
    scrambleText("R\nL A\tB", 1, "!@#"),
  );
  assert.equal(out, "!\n! !\t!");
});

test("scrambleText swaps based on the threshold draw", () => {
  // intensity=0.5 means: draw < 0.5 → swap, draw >= 0.5 → preserve.
  // Sequence: 0.1 (swap, then 0 picks `!`), 0.9 (preserve), 0.2
  // (swap, then 0 picks `!`), 0.7 (preserve).
  const out = withRandomSequence([0.1, 0, 0.9, 0.2, 0, 0.7], () =>
    scrambleText("ABCD", 0.5, "!@#"),
  );
  assert.equal(out, "!B!D");
});

test("scrambleReveal returns input unchanged when progress >= 1", () => {
  // No randoms consumed — short-circuits.
  const out = withRandomSequence([0], () =>
    scrambleReveal("RICCI LAB", 1, "!@#"),
  );
  assert.equal(out, "RICCI LAB");
});

test("scrambleReveal reveals chars left-to-right by index/length", () => {
  // text length 8, progress 0.5 → indices 0..3 reveal (i/8 < 0.5),
  // indices 4..7 scramble. Math.random=0 picks glitch char `!`.
  const out = withRandomSequence([0], () =>
    scrambleReveal("RICCILAB", 0.5, "!@#"),
  );
  assert.equal(out, "RICC!!!!");
});

test("scrambleReveal preserves whitespace at every progress", () => {
  // text "AB CD" length 5, progress 0 → all chars in scramble zone,
  // but the space at index 2 stays untouched.
  const out = withRandomSequence([0], () =>
    scrambleReveal("AB CD", 0, "!@#"),
  );
  assert.equal(out, "!! !!");
});

test("Hero and GlitchTitle use the shared scramble helpers, not local copies", () => {
  const callSites = [
    "src/components/landing/Hero.tsx",
    "src/components/ui/GlitchTitle.tsx",
  ];

  for (const file of callSites) {
    const source = readFileSync(file, "utf8");
    assert.match(
      source,
      /from "@\/lib\/glitch-text";/,
      `${file} should import from @/lib/glitch-text`,
    );
    // The hot-spot pattern that used to be inlined: a `.map` body
    // that both rolls the threshold and picks a glitch char on the
    // same line. If anything resembling that survives, the refactor
    // missed a site.
    assert.doesNotMatch(
      source,
      /Math\.random\(\) < [^?]+\? .*\[Math\.floor\(Math\.random/,
      `${file} still contains an inline scramble pattern`,
    );
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { extractHeadings } from "../src/lib/toc";

test("extractHeadings returns H1-H3 headings in document order", () => {
  const headings = extractHeadings(`
# Intro

Body copy.

## Details

### Deep Dive

#### Not in the table of contents
`);

  assert.deepEqual(headings, [
    { id: "intro", text: "Intro", level: 1 },
    { id: "details", text: "Details", level: 2 },
    { id: "deep-dive", text: "Deep Dive", level: 3 },
  ]);
});

test("extractHeadings strips inline markdown before building ids", () => {
  const headings = extractHeadings(`
# **Bold** and *Italic*
## Use \`code\` safely
### [Linked text](https://example.com/path)
`);

  assert.deepEqual(headings, [
    { id: "bold-and-italic", text: "Bold and Italic", level: 1 },
    { id: "use-code-safely", text: "Use code safely", level: 2 },
    { id: "linked-text", text: "Linked text", level: 3 },
  ]);
});

test("extractHeadings preserves current Hangul slug behavior", () => {
  const headings = extractHeadings("# 한글 Heading! ++");

  assert.deepEqual(headings, [
    { id: "한글-heading-", text: "한글 Heading! ++", level: 1 },
  ]);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  fsFrontmatterToProject,
  normalizeProjectDate,
  normalizeProjectTech,
  type FsProjectRaw,
} from "../src/lib/project-frontmatter";

const categoryNameToId = new Map([
  ["automata", "cat-automata"],
  ["visualization", "cat-visualization"],
]);

test("normalizeProjectTech preserves array values", () => {
  assert.deepEqual(normalizeProjectTech(["rust", "wasm"]), ["rust", "wasm"]);
});

test("normalizeProjectTech splits comma-separated frontmatter strings", () => {
  assert.deepEqual(normalizeProjectTech("rust, wasm, , next"), [
    "rust",
    "wasm",
    "next",
  ]);
});

test("normalizeProjectDate preserves strings and normalizes Date values", () => {
  assert.equal(normalizeProjectDate("2026-04-25"), "2026-04-25");
  assert.equal(
    normalizeProjectDate(new Date("2026-04-25T15:30:00.000Z")),
    "2026-04-25"
  );
  assert.equal(normalizeProjectDate(undefined), "");
});

test("fsFrontmatterToProject preserves local project fallback semantics", () => {
  const raw: FsProjectRaw = {
    slug: "local-project",
    data: {
      summary: "Summary fallback",
      category: " Automata ",
      tech: "rust, wasm",
      status: "Active",
      featured: true,
      date: new Date("2026-04-25T00:00:00.000Z"),
      github: "https://github.com/example/project",
      link: "https://example.com",
      order: 0,
    },
    content: "# Project",
  };

  assert.deepEqual(fsFrontmatterToProject(raw, categoryNameToId), {
    slug: "local-project",
    title: "local-project",
    description: "Summary fallback",
    categoryId: "cat-automata",
    categoryName: "Automata",
    tech: ["rust", "wasm"],
    status: "Active",
    featured: true,
    date: "2026-04-25",
    link: "https://example.com",
    github: "https://github.com/example/project",
    order: 0,
    notionPageId: null,
  });
});

test("fsFrontmatterToProject keeps unmatched categories visible but unlinked", () => {
  const raw: FsProjectRaw = {
    slug: "uncategorized-project",
    data: {
      title: "Custom title",
      description: "Description wins",
      summary: "Ignored summary",
      category: "Unknown",
    },
    content: "",
  };

  assert.deepEqual(fsFrontmatterToProject(raw, categoryNameToId), {
    slug: "uncategorized-project",
    title: "Custom title",
    description: "Description wins",
    categoryId: null,
    categoryName: "Unknown",
    tech: [],
    status: "",
    featured: false,
    date: "",
    link: undefined,
    github: undefined,
    order: 999,
    notionPageId: null,
  });
});

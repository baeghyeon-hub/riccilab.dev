import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  readFsContentFileBySlug,
  readFsContentFiles,
} from "../src/lib/fs-content";

type TestFrontmatter = {
  title?: string;
  tags?: string[];
};

function withTempDir(run: (directory: string) => void) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "riccilab-fs-content-")
  );

  try {
    run(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("readFsContentFiles returns an empty list for missing directories", () => {
  withTempDir((directory) => {
    assert.deepEqual(
      readFsContentFiles(path.join(directory, "missing")),
      []
    );
  });
});

test("readFsContentFiles reads markdown and mdx files with frontmatter", () => {
  withTempDir((directory) => {
    fs.writeFileSync(
      path.join(directory, "alpha.mdx"),
      [
        "---",
        "title: Alpha",
        "tags:",
        "  - one",
        "  - two",
        "---",
        "# Alpha body",
      ].join("\n")
    );
    fs.writeFileSync(
      path.join(directory, "beta.md"),
      ["---", "title: Beta", "---", "Beta body"].join("\n")
    );
    fs.writeFileSync(path.join(directory, "ignored.txt"), "Nope");

    const files = readFsContentFiles<TestFrontmatter>(directory).sort((a, b) =>
      a.slug.localeCompare(b.slug)
    );

    assert.deepEqual(
      files.map((file) => ({
        slug: file.slug,
        filename: file.filename,
        title: file.data.title,
        content: file.content.trim(),
      })),
      [
        {
          slug: "alpha",
          filename: "alpha.mdx",
          title: "Alpha",
          content: "# Alpha body",
        },
        {
          slug: "beta",
          filename: "beta.md",
          title: "Beta",
          content: "Beta body",
        },
      ]
    );
    assert.deepEqual(files[0].data.tags, ["one", "two"]);
  });
});

test("readFsContentFileBySlug prefers mdx over md for the same slug", () => {
  withTempDir((directory) => {
    fs.writeFileSync(
      path.join(directory, "post.md"),
      ["---", "title: Markdown", "---", "Markdown body"].join("\n")
    );
    fs.writeFileSync(
      path.join(directory, "post.mdx"),
      ["---", "title: MDX", "---", "MDX body"].join("\n")
    );

    const file = readFsContentFileBySlug<TestFrontmatter>(directory, "post");

    assert.equal(file?.filename, "post.mdx");
    assert.equal(file?.data.title, "MDX");
    assert.equal(file?.content.trim(), "MDX body");
  });
});

test("readFsContentFileBySlug returns null when neither extension exists", () => {
  withTempDir((directory) => {
    assert.equal(
      readFsContentFileBySlug<TestFrontmatter>(directory, "missing"),
      null
    );
  });
});

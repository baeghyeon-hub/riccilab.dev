import assert from "node:assert/strict";
import test from "node:test";
import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import {
  blocksToMdx,
  richTextToMdx,
  richTextToPlain,
  type NotionBlock,
} from "../src/lib/notion-mdx";

function textRun(
  plainText: string,
  overrides: Partial<RichTextItemResponse["annotations"]> = {},
  linkUrl?: string
): RichTextItemResponse {
  return {
    type: "text",
    plain_text: plainText,
    href: linkUrl ?? null,
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
      ...overrides,
    },
    text: {
      content: plainText,
      link: linkUrl ? { url: linkUrl } : null,
    },
  } as RichTextItemResponse;
}

function equationRun(expression: string): RichTextItemResponse {
  return {
    type: "equation",
    plain_text: expression,
    href: null,
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
    },
    equation: { expression },
  } as RichTextItemResponse;
}

function block(shape: Record<string, unknown>): NotionBlock {
  return shape as unknown as NotionBlock;
}

const fetchNoChildren = async () => [];

test("richTextToMdx preserves escaping, links, code, and grouped emphasis", () => {
  const mdx = richTextToMdx([
    textRun("a <b> {x} "),
    textRun("link", {}, "https://example.com"),
    textRun(" raw<{x}>", { code: true }),
    textRun(" bold ", { bold: true }),
    textRun("more", { bold: true }),
    equationRun("x^2"),
  ]);

  assert.equal(
    mdx,
    "a &lt;b&gt; &#123;x&#125; [link](https://example.com)` raw<{x}>`** bold more**$x^2$"
  );
});

test("richTextToPlain preserves raw code block text", () => {
  assert.equal(
    richTextToPlain([textRun("const x = 1;"), textRun("\nreturn x;")]),
    "const x = 1;\nreturn x;"
  );
});

test("blocksToMdx renders nested quote children through an injected fetcher", async () => {
  const quote = block({
    object: "block",
    id: "quote-1",
    type: "quote",
    has_children: true,
    quote: { rich_text: [textRun("Parent")] },
  });
  const child = block({
    object: "block",
    id: "paragraph-1",
    type: "paragraph",
    has_children: false,
    paragraph: { rich_text: [textRun("Child")] },
  });

  const mdx = await blocksToMdx([quote], async (blockId) =>
    blockId === "quote-1" ? [child] : []
  );

  assert.equal(mdx, "> Parent\n\n  Child\n\n");
});

test("blocksToMdx keeps Mermaid code blocks base64 encoded", async () => {
  const source = "graph TD\nA-->B";
  const code = block({
    object: "block",
    id: "code-1",
    type: "code",
    has_children: false,
    code: {
      language: "mermaid",
      rich_text: [textRun(source)],
      caption: [],
    },
  });

  const mdx = await blocksToMdx([code], fetchNoChildren);

  assert.equal(
    mdx,
    `<Mermaid chart="${Buffer.from(source, "utf-8").toString("base64")}" />\n\n`
  );
});

test("blocksToMdx keeps cyberchart caption parsing behavior", async () => {
  const code = block({
    object: "block",
    id: "code-2",
    type: "code",
    has_children: false,
    code: {
      language: "plain text",
      rich_text: [
        textRun("type:linear\nyScale:log\nx,y\n0,1\n1,10"),
      ],
      caption: [textRun("cyberchart")],
    },
  });

  const mdx = await blocksToMdx([code], fetchNoChildren);

  assert.equal(
    mdx,
    `<CyberChart data='x,y\n0,1\n1,10' type="linear" yScale="log" />\n\n`
  );
});

test("blocksToMdx renders Notion tables as markdown tables", async () => {
  const table = block({
    object: "block",
    id: "table-1",
    type: "table",
    has_children: true,
    table: {},
  });
  const rows = [
    block({
      object: "block",
      id: "row-1",
      type: "table_row",
      has_children: false,
      table_row: {
        cells: [[textRun("A")], [textRun("B")]],
      },
    }),
    block({
      object: "block",
      id: "row-2",
      type: "table_row",
      has_children: false,
      table_row: {
        cells: [[textRun("1")], [textRun("2")]],
      },
    }),
  ];

  const mdx = await blocksToMdx([table], async (blockId) =>
    blockId === "table-1" ? rows : []
  );

  assert.equal(mdx, "| A | B |\n| --- | --- |\n| 1 | 2 |\n\n");
});

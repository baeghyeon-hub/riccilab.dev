import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import type { BlogPost } from "./blog";
import { getAllCategories } from "./categories";
import type {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  getDateStart,
  getMultiSelectNames,
  getRelationIds,
  getRichText,
  getTitleText,
  requireFullPage,
} from "./notion-properties";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID ?? "";

// ─── Rich text helpers ───────────────────────────────────────────────

function escapeMdxChars(text: string): string {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
}

/** Plain text extraction without MDX escaping (for code blocks) */
function richTextToPlain(richTexts: RichTextItemResponse[]): string {
  return richTexts.map((rt) => rt.plain_text).join("");
}

function richTextToMdx(richTexts: RichTextItemResponse[]): string {
  // Render one run's *inner* content — code formatting, links, MDX escapes.
  // Emphasis wrapping (bold/italic/strike) is applied at the *group* level
  // below so adjacent runs that share the same emphasis are wrapped once.
  // Otherwise we'd emit `**foo **\`bar\`** baz**` which markdown parsers
  // don't resolve back to a single bold span: the `****` sequences collapse
  // and spaces around the delimiters break left/right-flanking rules, so
  // the asterisks survive as literal text in the final HTML.
  const renderInner = (rt: RichTextItemResponse): string => {
    if (rt.type === "equation") {
      return `$${rt.equation.expression}$`;
    }
    let text = rt.plain_text;
    const a = rt.annotations;
    if (!a.code) text = escapeMdxChars(text);
    if (rt.type === "text" && rt.text.link) {
      text = `[${text}](${rt.text.link.url})`;
    }
    if (a.code) text = `\`${text}\``;
    return text;
  };

  const parts: string[] = [];
  let i = 0;
  while (i < richTexts.length) {
    const first = richTexts[i];
    // Equations are standalone; no emphasis wrapping (they already render
    // as their own inline math span).
    if (first.type === "equation") {
      parts.push(renderInner(first));
      i++;
      continue;
    }
    const a0 = first.annotations;
    let j = i + 1;
    while (
      j < richTexts.length &&
      richTexts[j].type !== "equation" &&
      richTexts[j].annotations.bold === a0.bold &&
      richTexts[j].annotations.italic === a0.italic &&
      richTexts[j].annotations.strikethrough === a0.strikethrough
    ) {
      j++;
    }
    let inner = richTexts.slice(i, j).map(renderInner).join("");
    if (a0.strikethrough) inner = `~~${inner}~~`;
    if (a0.italic) inner = `*${inner}*`;
    if (a0.bold) inner = `**${inner}**`;
    parts.push(inner);
    i = j;
  }
  return parts.join("");
}

// ─── Block-to-MDX converter ─────────────────────────────────────────

type Block = BlockObjectResponse;

async function fetchAllBlocks(blockId: string): Promise<Block[]> {
  const blocks: Block[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const b of res.results) {
      if ("type" in b) blocks.push(b as Block);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return blocks;
}

async function blockToMdx(block: Block, indent = ""): Promise<string> {
  let children = "";
  if (block.has_children) {
    const childBlocks = await fetchAllBlocks(block.id);
    children = await blocksToMdx(childBlocks, indent + "  ");
  }

  switch (block.type) {
    case "paragraph":
      return `${indent}${richTextToMdx(block.paragraph.rich_text)}\n\n`;

    case "heading_1":
      return `# ${richTextToMdx(block.heading_1.rich_text)}\n\n`;
    case "heading_2":
      return `## ${richTextToMdx(block.heading_2.rich_text)}\n\n`;
    case "heading_3":
      return `### ${richTextToMdx(block.heading_3.rich_text)}\n\n`;

    case "bulleted_list_item": {
      const line = `${indent}- ${richTextToMdx(block.bulleted_list_item.rich_text)}\n`;
      return line + children;
    }
    case "numbered_list_item": {
      const line = `${indent}1. ${richTextToMdx(block.numbered_list_item.rich_text)}\n`;
      return line + children;
    }

    case "code": {
      const lang = block.code.language === "plain text" ? "" : block.code.language;
      const codeText = richTextToPlain(block.code.rich_text);

      // Special: cyberchart code blocks (caption-based since Notion doesn't have "cyberchart" language)
      const caption = block.code.caption ? richTextToMdx(block.code.caption) : "";
      if (caption.toLowerCase() === "cyberchart" || (lang as string) === "cyberchart") {
        // Parse lines to extract type/yScale, rest is data
        const lines = codeText.split("\n");
        let type = "stepAfter";
        let yScale = "linear";
        const dataLines: string[] = [];
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("type:")) {
            type = trimmed.replace("type:", "").trim();
          } else if (trimmed.startsWith("yScale:")) {
            yScale = trimmed.replace("yScale:", "").trim();
          } else {
            dataLines.push(line);
          }
        }
        const data = dataLines.join("\n").trim();
        return `<CyberChart data='${data}' type="${type}" yScale="${yScale}" />\n\n`;
      }

      // Special: mermaid diagrams → client-rendered SVG component.
      // We base64-encode the diagram source and pass it as a plain string
      // attribute. A JSX *expression* attribute (`code={"..."}`) doesn't
      // round-trip reliably through the MDX pipeline when the body spans
      // multiple lines or contains characters MDX treats as significant
      // (curly braces, backticks, etc.), and the prop name `code` also
      // collides with our lowercase `code` element handler. A base64
      // string attribute sidesteps both issues — the component decodes it
      // back to the original source on the server before rendering.
      if ((lang as string) === "mermaid") {
        const b64 = Buffer.from(codeText, "utf-8").toString("base64");
        return `<Mermaid chart="${b64}" />\n\n`;
      }

      return `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
    }

    case "equation":
      return `$$\n${block.equation.expression}\n$$\n\n`;

    case "image": {
      const url =
        block.image.type === "external"
          ? block.image.external.url
          : block.image.file.url;
      const caption = block.image.caption
        ? richTextToMdx(block.image.caption)
        : "";
      return `![${caption}](${url})\n\n`;
    }

    case "divider":
      return `---\n\n`;

    case "quote":
      return `> ${richTextToMdx(block.quote.rich_text)}\n\n${children}`;

    case "callout": {
      const icon =
        block.callout.icon?.type === "emoji" ? block.callout.icon.emoji + " " : "";
      return `> ${icon}${richTextToMdx(block.callout.rich_text)}\n\n${children}`;
    }

    case "toggle": {
      const summary = richTextToMdx(block.toggle.rich_text);
      return `<details>\n<summary>${summary}</summary>\n\n${children}</details>\n\n`;
    }

    case "bookmark":
      return `[${block.bookmark.url}](${block.bookmark.url})\n\n`;

    case "table": {
      if (!block.has_children) return "";
      const rows = await fetchAllBlocks(block.id);
      const mdxRows: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.type !== "table_row") continue;
        const cells = row.table_row.cells.map((cell) => richTextToMdx(cell));
        mdxRows.push(`| ${cells.join(" | ")} |`);
        if (i === 0) {
          mdxRows.push(`| ${cells.map(() => "---").join(" | ")} |`);
        }
      }
      return mdxRows.join("\n") + "\n\n";
    }

    default:
      return "";
  }
}

async function blocksToMdx(blocks: Block[], indent = ""): Promise<string> {
  const parts: string[] = [];
  for (const block of blocks) {
    parts.push(await blockToMdx(block, indent));
  }
  return parts.join("");
}

// ─── Public API ──────────────────────────────────────────────────────

export interface NotionBlogPost extends BlogPost {
  notionPageId: string;
}

export const getNotionPosts = unstable_cache(
  async (): Promise<NotionBlogPost[]> => {
    if (!DATABASE_ID) return [];
    try {
      const [response, categories] = await Promise.all([
        notion.dataSources.query({
          data_source_id: DATABASE_ID,
          filter: {
            property: "Published",
            checkbox: { equals: true },
          },
          sorts: [{ property: "Date", direction: "descending" }],
        }),
        getAllCategories(),
      ]);
      const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

      return response.results.map((result) => {
        const page = requireFullPage(result);
        const props = page.properties;

        const title =
          getTitleText(props, "Title") ??
          getTitleText(props, "Name") ??
          "Untitled";

        const date = getDateStart(props, "Date") ?? "";

        const description = getRichText(props, "Description") ?? "";

        const tags = getMultiSelectNames(props, "Tags");

        const slug =
          getRichText(props, "Slug") ??
          title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, "")
            .replace(/\s+/g, "-");

        const categoryId = getRelationIds(props, "Category")[0] ?? null;
        const categoryName = categoryId
          ? categoryNameById.get(categoryId) ?? ""
          : "";

        return {
          slug,
          title,
          date,
          description,
          tags,
          categoryId,
          categoryName,
          notionPageId: page.id,
        };
      });
    } catch (err) {
      console.error("Failed to fetch Notion posts:", err);
      return [];
    }
  },
  ["notion-posts"],
  { tags: ["notion-posts"], revalidate: 300 }
);

export const getNotionPostContent = unstable_cache(
  async (pageId: string): Promise<string> => {
    const blocks = await fetchAllBlocks(pageId);
    return blocksToMdx(blocks);
  },
  // Key is versioned so bumping it invalidates previously-cached MDX that
  // was produced by an older converter (e.g. before the emphasis-grouping
  // and mermaid-base64 fixes). Bump the suffix whenever the converter's
  // output format changes in a user-visible way.
  ["notion-post-content-v2"],
  { tags: ["notion-post"], revalidate: 300 }
);

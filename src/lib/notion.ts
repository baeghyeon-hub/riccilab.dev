import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import type { BlogPost } from "./blog";
import type {
  BlockObjectResponse,
  RichTextItemResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID ?? "";

// ─── Rich text helpers ───────────────────────────────────────────────

function richTextToMdx(richTexts: RichTextItemResponse[]): string {
  return richTexts
    .map((rt) => {
      if (rt.type === "equation") {
        return `$${rt.equation.expression}$`;
      }
      let text = rt.plain_text;
      if (rt.type === "text" && rt.text.link) {
        text = `[${text}](${rt.text.link.url})`;
      }
      const a = rt.annotations;
      if (a.code) text = `\`${text}\``;
      if (a.bold) text = `**${text}**`;
      if (a.italic) text = `*${text}*`;
      if (a.strikethrough) text = `~~${text}~~`;
      return text;
    })
    .join("");
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
      const codeText = richTextToMdx(block.code.rich_text);

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
      const response = await notion.dataSources.query({
        data_source_id: DATABASE_ID,
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [{ property: "Date", direction: "descending" }],
      });

      return response.results.map((page: any) => {
        const props = page.properties;

        const title =
          props.Title?.title?.[0]?.plain_text ??
          props.Name?.title?.[0]?.plain_text ??
          "Untitled";

        const date = props.Date?.date?.start ?? "";

        const description =
          props.Description?.rich_text?.[0]?.plain_text ?? "";

        const tags: string[] =
          props.Tags?.multi_select?.map((t: any) => t.name) ?? [];

        const slug =
          props.Slug?.rich_text?.[0]?.plain_text ??
          title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, "")
            .replace(/\s+/g, "-");

        return {
          slug,
          title,
          date,
          description,
          tags,
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
  ["notion-post-content"],
  { tags: ["notion-post"], revalidate: 300 }
);

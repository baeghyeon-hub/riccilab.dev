import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import type { BlogPost } from "./blog";
import { getAllCategories } from "./categories";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { blocksToMdx } from "./notion-mdx";
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
    return blocksToMdx(blocks, fetchAllBlocks);
  },
  // Key is versioned so bumping it invalidates previously-cached MDX that
  // was produced by an older converter (e.g. before the emphasis-grouping
  // and mermaid-base64 fixes). Bump the suffix whenever the converter's
  // output format changes in a user-visible way.
  ["notion-post-content-v2"],
  { tags: ["notion-post"], revalidate: 300 }
);

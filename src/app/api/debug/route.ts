import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const hasNotionKey = !!process.env.NOTION_API_KEY;
  const hasDbId = !!process.env.NOTION_BLOG_DATABASE_ID;
  const hasSecret = !!process.env.REVALIDATION_SECRET;
  const keyPrefix = process.env.NOTION_API_KEY?.slice(0, 8) ?? "NOT SET";
  const dbIdPrefix = process.env.NOTION_BLOG_DATABASE_ID?.slice(0, 8) ?? "NOT SET";

  // Try Notion API
  let notionResult = "not tested";
  if (hasNotionKey && hasDbId) {
    try {
      const { Client } = await import("@notionhq/client");
      const notion = new Client({ auth: process.env.NOTION_API_KEY });
      const res = await (notion as any).dataSources.query({
        data_source_id: process.env.NOTION_BLOG_DATABASE_ID,
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
      });
      notionResult = `OK - ${res.results.length} posts found`;
    } catch (err: any) {
      notionResult = `ERROR: ${err.message}`;
    }
  }

  return Response.json({
    env: {
      NOTION_API_KEY: hasNotionKey ? `set (${keyPrefix}...)` : "NOT SET",
      NOTION_BLOG_DATABASE_ID: hasDbId ? `set (${dbIdPrefix}...)` : "NOT SET",
      REVALIDATION_SECRET: hasSecret ? "set" : "NOT SET",
    },
    notionQuery: notionResult,
  });
}

import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PROJECTS_DATA_SOURCE_ID = process.env.NOTION_PROJECTS_DATABASE_ID ?? "";

export type ProjectStatus = "WIP" | "Active" | "Released" | "Archived" | "";

export interface Project {
  slug: string;
  title: string;
  description: string;
  category: string;
  tech: string[];
  status: ProjectStatus;
  featured: boolean;
  date: string;
  link?: string;
  github?: string;
  order: number;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, "")
    .replace(/\s+/g, "-");
}

export const getAllProjects = unstable_cache(
  async (): Promise<Project[]> => {
    if (!PROJECTS_DATA_SOURCE_ID) return [];
    try {
      const response = await notion.dataSources.query({
        data_source_id: PROJECTS_DATA_SOURCE_ID,
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
        sorts: [
          { property: "Order", direction: "ascending" },
          { property: "Date", direction: "descending" },
        ],
      });

      return response.results.map((page: any) => {
        const props = page.properties;

        const title = props.Title?.title?.[0]?.plain_text ?? "Untitled";
        const slug =
          props.Slug?.rich_text?.[0]?.plain_text ?? slugify(title);

        return {
          slug,
          title,
          description: props.Description?.rich_text?.[0]?.plain_text ?? "",
          category: props.Category?.select?.name ?? "",
          tech: props.Tech?.multi_select?.map((t: any) => t.name) ?? [],
          status: (props.Status?.select?.name ?? "") as ProjectStatus,
          featured: props.Featured?.checkbox ?? false,
          date: props.Date?.date?.start ?? "",
          link: props.Link?.url ?? undefined,
          github: props.GitHub?.url ?? undefined,
          order: props.Order?.number ?? 999,
        } satisfies Project;
      });
    } catch (err) {
      console.error("Failed to fetch Notion projects:", err);
      return [];
    }
  },
  ["notion-projects"],
  { tags: ["notion-projects"], revalidate: 300 }
);

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getAllProjects();
  const featured = all.filter((p) => p.featured);
  return featured.length > 0 ? featured : all.slice(0, 4);
}

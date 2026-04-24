import path from "path";
import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";
import { getNotionPostContent } from "./notion";
import { getAllCategories } from "./categories";
import { readFsContentFiles } from "./fs-content";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PROJECTS_DATA_SOURCE_ID = process.env.NOTION_PROJECTS_DATABASE_ID ?? "";

// Local MDX fallback — mirrors the blog's fs + Notion hybrid so projects with
// interactive React components (e.g. regex-viz/TraceViewer) can live next to
// Notion-authored entries. Filesystem wins on slug collision.
const PROJECTS_DIR = path.join(process.cwd(), "src/content/projects");

export type ProjectStatus = "WIP" | "Active" | "Released" | "Archived" | "";

export interface Project {
  slug: string;
  title: string;
  description: string;
  categoryId: string | null;
  /** Resolved leaf category name for display; empty when uncategorized. */
  categoryName: string;
  tech: string[];
  status: ProjectStatus;
  featured: boolean;
  date: string;
  link?: string;
  github?: string;
  order: number;
  /** Notion page id, or null for filesystem-sourced MDX projects. */
  notionPageId: string | null;
}

export interface ProjectWithContent extends Project {
  content: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ─── Filesystem helpers (sync, private) ──────────────────────────────

interface FsFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  summary?: string;
  category?: string;
  tech?: string[] | string;
  status?: ProjectStatus;
  featured?: boolean;
  github?: string;
  link?: string;
  order?: number;
}

interface FsProjectRaw {
  slug: string;
  data: FsFrontmatter;
  content: string;
}

function readFsProjectFiles(): FsProjectRaw[] {
  return readFsContentFiles<FsFrontmatter>(PROJECTS_DIR).map(
    ({ slug, data, content }) => ({ slug, data, content })
  );
}

function fsFrontmatterToProject(
  raw: FsProjectRaw,
  categoryNameToId: Map<string, string>
): Project {
  const { slug, data } = raw;
  const description = data.description ?? data.summary ?? "";
  const categoryName = (data.category ?? "").trim();
  // Match frontmatter category against Notion project categories case-
  // insensitively, so breadcrumb + /projects/categories/<slug> still works
  // without duplicating the category list in two places. Unmatched names
  // render as plain text with no linkable category chain.
  const categoryId =
    categoryName.length > 0
      ? categoryNameToId.get(categoryName.toLowerCase()) ?? null
      : null;
  const tech = Array.isArray(data.tech)
    ? data.tech
    : typeof data.tech === "string"
    ? data.tech.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // gray-matter auto-parses unquoted YAML dates (e.g. `date: 2026-04-20`)
  // into JS Date objects, which break when rendered as React children.
  // Normalize to an ISO `YYYY-MM-DD` string regardless of source shape.
  const rawDate = data.date as unknown;
  const dateStr =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : typeof rawDate === "string"
      ? rawDate
      : "";

  return {
    slug,
    title: data.title ?? slug,
    description,
    categoryId,
    categoryName,
    tech,
    status: (data.status ?? "") as ProjectStatus,
    featured: data.featured ?? false,
    date: dateStr,
    link: data.link,
    github: data.github,
    order: data.order ?? 999,
    notionPageId: null,
  };
}

// ─── Public async API ────────────────────────────────────────────────

export const getAllProjects = unstable_cache(
  async (): Promise<Project[]> => {
    const categories = await getAllCategories();
    const projectCategories = categories.filter((c) =>
      c.scope.includes("projects")
    );
    const categoryNameToId = new Map(
      projectCategories.map((c) => [c.name.toLowerCase(), c.id])
    );
    const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

    const fsRaw = readFsProjectFiles();
    const fsProjects = fsRaw.map((r) =>
      fsFrontmatterToProject(r, categoryNameToId)
    );
    const fsSlugs = new Set(fsProjects.map((p) => p.slug));

    let notionProjects: Project[] = [];
    if (PROJECTS_DATA_SOURCE_ID) {
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

        notionProjects = response.results.map((page: any) => {
          const props = page.properties;

          const title = props.Title?.title?.[0]?.plain_text ?? "Untitled";
          const slug =
            props.Slug?.rich_text?.[0]?.plain_text ?? slugify(title);

          const categoryId: string | null =
            props.Category?.relation?.[0]?.id ?? null;
          const categoryName = categoryId
            ? categoryNameById.get(categoryId) ?? ""
            : "";

          return {
            slug,
            title,
            description: props.Description?.rich_text?.[0]?.plain_text ?? "",
            categoryId,
            categoryName,
            tech: props.Tech?.multi_select?.map((t: any) => t.name) ?? [],
            status: (props.Status?.select?.name ?? "") as ProjectStatus,
            featured: props.Featured?.checkbox ?? false,
            date: props.Date?.date?.start ?? "",
            link: props.Link?.url ?? undefined,
            github: props.GitHub?.url ?? undefined,
            order: props.Order?.number ?? 999,
            notionPageId: page.id,
          } satisfies Project;
        });
      } catch (err) {
        console.error("Failed to fetch Notion projects:", err);
      }
    }

    // Filesystem wins on slug collision — matches blog.ts semantics.
    const merged = [
      ...fsProjects,
      ...notionProjects.filter((p) => !fsSlugs.has(p.slug)),
    ];

    // Sort by order asc, then date desc (mirrors Notion-side sort).
    merged.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.date && b.date) return a.date > b.date ? -1 : 1;
      return 0;
    });

    return merged;
  },
  ["notion-projects"],
  { tags: ["notion-projects"], revalidate: 300 }
);

export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getAllProjects();
  const featured = all.filter((p) => p.featured);
  return featured.length > 0 ? featured : all.slice(0, 4);
}

export async function getProjectBySlug(
  rawSlug: string
): Promise<ProjectWithContent | null> {
  const slug = decodeURIComponent(rawSlug);

  // Filesystem first — avoids a Notion round-trip for local MDX projects
  // and, more importantly, lets us return the raw .mdx as `content` so
  // JSX imports (e.g. <TraceViewer />) survive through to MDXRemote.
  const fsRaw = readFsProjectFiles().find((r) => r.slug === slug);
  if (fsRaw) {
    const categories = await getAllCategories();
    const categoryNameToId = new Map(
      categories
        .filter((c) => c.scope.includes("projects"))
        .map((c) => [c.name.toLowerCase(), c.id])
    );
    const meta = fsFrontmatterToProject(fsRaw, categoryNameToId);
    return { ...meta, content: fsRaw.content };
  }

  // Then Notion
  const all = await getAllProjects();
  const project = all.find((p) => p.slug === slug);
  if (!project || !project.notionPageId) return null;

  const content = await getNotionPostContent(project.notionPageId);
  return { ...project, content };
}

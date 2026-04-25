import type { Project, ProjectStatus } from "./projects";

export interface FsProjectFrontmatter {
  title?: string;
  date?: string | Date;
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

export interface FsProjectRaw {
  slug: string;
  data: FsProjectFrontmatter;
  content: string;
}

export function normalizeProjectTech(
  tech: FsProjectFrontmatter["tech"]
): string[] {
  return Array.isArray(tech)
    ? tech
    : typeof tech === "string"
    ? tech.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
}

export function normalizeProjectDate(
  date: FsProjectFrontmatter["date"]
): string {
  return date instanceof Date
    ? date.toISOString().slice(0, 10)
    : typeof date === "string"
    ? date
    : "";
}

export function fsFrontmatterToProject(
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

  return {
    slug,
    title: data.title ?? slug,
    description,
    categoryId,
    categoryName,
    tech: normalizeProjectTech(data.tech),
    status: (data.status ?? "") as ProjectStatus,
    featured: data.featured ?? false,
    date: normalizeProjectDate(data.date),
    link: data.link,
    github: data.github,
    order: data.order ?? 999,
    notionPageId: null,
  };
}

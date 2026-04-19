import { Client } from "@notionhq/client";
import { unstable_cache } from "next/cache";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Two separate Notion DBs — one per site section — so the in-Notion
// relation pickers on Blog Posts and Projects show only their own scope.
const BLOG_CATEGORIES_DATA_SOURCE_ID =
  process.env.NOTION_BLOG_CATEGORIES_DATABASE_ID ?? "";
const PROJECT_CATEGORIES_DATA_SOURCE_ID =
  process.env.NOTION_PROJECT_CATEGORIES_DATABASE_ID ?? "";

export type CategoryScope = "blog" | "projects";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  order: number;
  description: string;
  scope: CategoryScope[];
  published: boolean;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
  /** Slug chain from root → this node (inclusive). */
  path: string[];
  /** Id chain from root → this node (inclusive). */
  pathIds: string[];
}

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

// ─── Notion query ────────────────────────────────────────────────────

async function queryOneDataSource(
  dataSourceId: string,
  scope: CategoryScope
): Promise<Category[]> {
  if (!dataSourceId) return [];
  try {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: "Published",
        checkbox: { equals: true },
      },
      sorts: [{ property: "Order", direction: "ascending" }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text ?? "Untitled";
      const slugRaw = props.Slug?.rich_text?.[0]?.plain_text ?? "";
      // Parent relation is optional — the split DBs ship flat by default,
      // but we keep the field so nested hierarchies still work if added.
      const parentRelation = props.Parent?.relation ?? [];

      return {
        id: page.id,
        name,
        slug: normalizeSlug(slugRaw || name),
        parentId: parentRelation[0]?.id ?? null,
        order: props.Order?.number ?? 999,
        description: props.Description?.rich_text?.[0]?.plain_text ?? "",
        scope: [scope],
        published: props.Published?.checkbox ?? false,
      } satisfies Category;
    });
  } catch (err) {
    console.error(
      `Failed to fetch Notion categories (${scope}):`,
      err
    );
    return [];
  }
}

export const getAllCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const [blog, projects] = await Promise.all([
      queryOneDataSource(BLOG_CATEGORIES_DATA_SOURCE_ID, "blog"),
      queryOneDataSource(PROJECT_CATEGORIES_DATA_SOURCE_ID, "projects"),
    ]);
    return [...blog, ...projects];
  },
  ["notion-categories"],
  { tags: ["notion-categories"], revalidate: 300 }
);

// ─── Tree utilities ──────────────────────────────────────────────────

function buildTree(
  categories: Category[],
  scope?: CategoryScope
): CategoryNode[] {
  const eligible = scope
    ? categories.filter((c) => c.scope.includes(scope))
    : categories;

  const byId = new Map<string, CategoryNode>();
  for (const c of eligible) {
    byId.set(c.id, { ...c, children: [], path: [], pathIds: [] });
  }

  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortFn = (a: CategoryNode, b: CategoryNode) =>
    a.order - b.order || a.name.localeCompare(b.name);

  const fixPaths = (node: CategoryNode, parent: CategoryNode | null) => {
    node.path = parent ? [...parent.path, node.slug] : [node.slug];
    node.pathIds = parent ? [...parent.pathIds, node.id] : [node.id];
    node.children.sort(sortFn);
    for (const child of node.children) fixPaths(child, node);
  };

  roots.sort(sortFn);
  for (const r of roots) fixPaths(r, null);
  return roots;
}

export async function getCategoryTree(
  scope: CategoryScope
): Promise<CategoryNode[]> {
  return buildTree(await getAllCategories(), scope);
}

/** Flatten the tree into a list (pre-order) — useful for sitemap / static params. */
export function flattenTree(roots: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (n: CategoryNode) => {
    out.push(n);
    for (const c of n.children) walk(c);
  };
  for (const r of roots) walk(r);
  return out;
}

/** Resolve a URL slug chain (e.g. ["cpp26", "reflection"]) to a tree node. */
export async function resolveCategoryPath(
  chain: string[],
  scope: CategoryScope
): Promise<CategoryNode | null> {
  if (chain.length === 0) return null;
  const lowered = chain.map(normalizeSlug);
  let level = await getCategoryTree(scope);
  let current: CategoryNode | null = null;
  for (const seg of lowered) {
    const match = level.find((n) => n.slug === seg);
    if (!match) return null;
    current = match;
    level = match.children;
  }
  return current;
}

/** Walk parent chain for a leaf id. Returns root→leaf. */
export async function getCategoryChain(
  leafId: string | null
): Promise<Category[]> {
  if (!leafId) return [];
  const all = await getAllCategories();
  const byId = new Map(all.map((c) => [c.id, c]));
  const chain: Category[] = [];
  const seen = new Set<string>();
  let cur = byId.get(leafId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return chain;
}

/** Collect subtree ids (including self). Used to filter posts/projects. */
export function collectSubtreeIds(node: CategoryNode): string[] {
  const ids: string[] = [node.id];
  for (const child of node.children) ids.push(...collectSubtreeIds(child));
  return ids;
}

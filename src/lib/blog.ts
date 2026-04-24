import path from "path";
import { getNotionPosts, getNotionPostContent } from "./notion";
import { readFsContentFileBySlug, readFsContentFiles } from "./fs-content";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  categoryId: string | null;
  /** Resolved leaf category name for display; empty when uncategorized. */
  categoryName: string;
}

interface FsBlogFrontmatter {
  title?: string;
  date?: string;
  description?: string;
  tags?: string[];
}

// ─── Filesystem helpers (sync, private) ──────────────────────────────

function getFilesystemPosts(): BlogPost[] {
  return readFsContentFiles<FsBlogFrontmatter>(BLOG_DIR).map(
    ({ slug, data }) => {
    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      description: data.description || "",
      tags: data.tags || [],
      categoryId: null,
      categoryName: "",
    };
    }
  );
}

function getFilesystemPostBySlug(slug: string) {
  const fsPost = readFsContentFileBySlug<FsBlogFrontmatter>(BLOG_DIR, slug);
  if (!fsPost) return null;

  const { data, content } = fsPost;
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    description: data.description || "",
    tags: data.tags || [],
    categoryId: null,
    content,
  };
}

// ─── Public async API ────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPost[]> {
  const fsPosts = getFilesystemPosts();
  const notionPosts = await getNotionPosts();

  // Filesystem wins on slug collision
  const slugSet = new Set(fsPosts.map((p) => p.slug));
  const merged: BlogPost[] = [
    ...fsPosts,
    ...notionPosts.filter((p) => !slugSet.has(p.slug)),
  ];

  return merged.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);

  // Filesystem first
  const fsPost = getFilesystemPostBySlug(slug);
  if (fsPost) return fsPost;

  // Then Notion
  const notionPosts = await getNotionPosts();
  const notionPost = notionPosts.find((p) => p.slug === slug);
  if (!notionPost) return null;

  const content = await getNotionPostContent(notionPost.notionPageId);

  return {
    slug: notionPost.slug,
    title: notionPost.title,
    date: notionPost.date,
    description: notionPost.description,
    tags: notionPost.tags,
    categoryId: notionPost.categoryId,
    categoryName: notionPost.categoryName,
    content,
  };
}

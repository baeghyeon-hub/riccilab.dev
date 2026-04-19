import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getNotionPosts, getNotionPostContent, type NotionBlogPost } from "./notion";

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

// ─── Filesystem helpers (sync, private) ──────────────────────────────

function getFilesystemPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  return files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "");
    const filePath = path.join(BLOG_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContent);

    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      description: data.description || "",
      tags: data.tags || [],
      categoryId: null,
      categoryName: "",
    };
  });
}

function getFilesystemPostBySlug(slug: string) {
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

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

import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface FsContentFile<TData> {
  slug: string;
  filename: string;
  filePath: string;
  data: TData;
  content: string;
}

function isMarkdownContentFile(filename: string): boolean {
  return filename.endsWith(".mdx") || filename.endsWith(".md");
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

function readContentFile<TData>(
  filePath: string,
  slug = slugFromFilename(path.basename(filePath))
): FsContentFile<TData> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    filename: path.basename(filePath),
    filePath,
    data: data as TData,
    content,
  };
}

export function readFsContentFiles<TData>(
  directory: string
): FsContentFile<TData>[] {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .filter(isMarkdownContentFile)
    .map((filename) =>
      readContentFile<TData>(path.join(directory, filename))
    );
}

export function readFsContentFileBySlug<TData>(
  directory: string,
  slug: string
): FsContentFile<TData> | null {
  const mdxPath = path.join(directory, `${slug}.mdx`);
  const mdPath = path.join(directory, `${slug}.md`);
  const filePath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(filePath)) return null;

  return readContentFile<TData>(filePath, slug);
}

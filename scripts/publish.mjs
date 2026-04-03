#!/usr/bin/env node

/**
 * Blog Post Publisher
 *
 * Usage:
 *   npm run publish "posts/동역학적 시스템 학습"
 *   npm run publish "posts/새 포스트 폴더"
 *
 * What it does:
 *   1. Finds the .md file in the given folder
 *   2. Extracts title, description from content
 *   3. Generates slug from folder name
 *   4. Copies images to public/blog/{slug}/
 *   5. Rewrites image paths
 *   6. Outputs .mdx with frontmatter to src/content/blog/{slug}.mdx
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ─── Config ────────────────────────────────────────────────
const CONTENT_DIR = path.join(ROOT, "src/content/blog");
const PUBLIC_BLOG = path.join(ROOT, "public/blog");
const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];

// ─── Helpers ───────────────────────────────────────────────
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[가-힣]+/g, (match) => {
      // Simple Korean romanization mapping for common chars
      // Falls back to transliterated slug
      return match;
    })
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateSlug(folderName, title) {
  // Try to make an English slug from the title first
  const englishWords = title.match(/[a-zA-Z0-9]+/g);
  if (englishWords && englishWords.length >= 2) {
    return slugify(englishWords.join(" "));
  }
  // Otherwise use folder name
  return slugify(folderName);
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractDescription(lines) {
  // Find first non-heading, non-empty paragraph
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("!")) continue;
    if (trimmed.startsWith("|")) continue;
    if (trimmed.startsWith("-")) continue;
    if (trimmed.startsWith(">")) continue;
    if (trimmed.startsWith("$$")) continue;
    if (trimmed.startsWith("---")) continue;
    // Found a paragraph
    return trimmed.length > 120 ? trimmed.slice(0, 117) + "..." : trimmed;
  }
  return "";
}

function extractTags(content) {
  const tags = new Set();

  // Extract from common keywords
  const keywordMap = {
    TCP: "TCP/IP",
    HTTP: "HTTP",
    SQL: "security",
    XSS: "security",
    "동역학": "dynamical-systems",
    네트워크: "network",
    보안: "security",
    암호: "cryptography",
    React: "react",
    "Next.js": "nextjs",
    TypeScript: "typescript",
    Python: "python",
    JavaScript: "javascript",
    알고리즘: "algorithm",
    "머신러닝": "machine-learning",
    "딥러닝": "deep-learning",
    데이터: "data",
    디자인: "design",
    CSS: "css",
  };

  for (const [keyword, tag] of Object.entries(keywordMap)) {
    if (content.includes(keyword)) {
      tags.add(tag);
    }
  }

  // Limit to 4 tags
  return [...tags].slice(0, 4);
}

function getToday() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main ──────────────────────────────────────────────────
function main() {
  const inputArg = process.argv[2];

  if (!inputArg) {
    console.log("");
    console.log("  \x1b[1mBlog Publisher\x1b[0m");
    console.log("");
    console.log("  Usage:");
    console.log('    npm run publish "posts/폴더이름"');
    console.log("");

    // List available posts
    const postsDir = path.join(ROOT, "posts");
    if (fs.existsSync(postsDir)) {
      const folders = fs
        .readdirSync(postsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      if (folders.length > 0) {
        console.log("  Available drafts in /posts:");
        folders.forEach((f) => {
          const published = isPublished(f);
          const status = published ? "\x1b[33m[published]\x1b[0m" : "\x1b[32m[draft]\x1b[0m";
          console.log(`    ${status} ${f}`);
        });
      } else {
        console.log("  /posts 폴더가 비어있습니다. 폴더를 만들고 .md 파일을 넣어주세요.");
      }
    }
    console.log("");
    process.exit(0);
  }

  // Resolve folder path
  const folderPath = path.isAbsolute(inputArg) ? inputArg : path.resolve(ROOT, inputArg);

  if (!fs.existsSync(folderPath)) {
    console.error(`\x1b[31mError:\x1b[0m 폴더를 찾을 수 없습니다: ${folderPath}`);
    process.exit(1);
  }

  // Find .md file
  const files = fs.readdirSync(folderPath);
  const mdFile = files.find((f) => f.endsWith(".md"));

  if (!mdFile) {
    console.error(`\x1b[31mError:\x1b[0m .md 파일을 찾을 수 없습니다: ${folderPath}`);
    process.exit(1);
  }

  const mdPath = path.join(folderPath, mdFile);
  const rawContent = fs.readFileSync(mdPath, "utf-8");
  const lines = rawContent.split("\n");
  const folderName = path.basename(folderPath);

  // Extract metadata
  const title = extractTitle(rawContent) || folderName;
  const description = extractDescription(lines);
  const tags = extractTags(rawContent);
  const date = getToday();
  const slug = generateSlug(folderName, title);

  console.log("");
  console.log("  \x1b[1m📝 Publishing blog post\x1b[0m");
  console.log(`  Title:       ${title}`);
  console.log(`  Slug:        ${slug}`);
  console.log(`  Date:        ${date}`);
  console.log(`  Tags:        ${tags.join(", ")}`);
  console.log(`  Description: ${description.slice(0, 60)}...`);
  console.log("");

  // Create image directory
  const imgDir = path.join(PUBLIC_BLOG, slug);
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }

  // Find and copy images
  const imageFiles = files.filter((f) =>
    IMAGE_EXTS.includes(path.extname(f).toLowerCase())
  );

  imageFiles.forEach((img) => {
    const src = path.join(folderPath, img);
    const dest = path.join(imgDir, img);
    fs.copyFileSync(src, dest);
    console.log(`  \x1b[36m[image]\x1b[0m ${img} → public/blog/${slug}/${img}`);
  });

  // Process content: remove first h1 (used as title), rewrite image paths
  let content = rawContent;

  // Remove the first # heading (it becomes the title in frontmatter)
  content = content.replace(/^#\s+.+\n*/m, "");

  // Rewrite image paths: ![alt](filename.png) → ![alt](/blog/slug/filename.png)
  content = content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|\/)([\w가-힣\s._-]+\.(png|jpg|jpeg|gif|webp|svg|avif))\)/gi,
    (_, alt, filename) => `![${alt}](/blog/${slug}/${filename})`
  );

  // Strip references section at the bottom (after final ---)
  content = content.replace(/\n---\n\n(\[\[[\d]+\]\][\s\S]*$)/, "");

  // Strip inline reference links [[1]](url) from body text
  content = content.replace(/\[\[(\d+)\]\]\([^)]*\)/g, "");

  // Keep $...$ and $$...$$ math expressions as-is for KaTeX rendering

  // Clean up stray double spaces from removed references
  content = content.replace(/  +/g, " ");
  // Clean up empty parentheses left behind
  content = content.replace(/ \(\)/g, "");

  // Build frontmatter
  const frontmatter = [
    "---",
    `title: "${title}"`,
    `date: "${date}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
    "---",
    "",
  ].join("\n");

  const finalContent = frontmatter + content.trim() + "\n";

  // Write MDX file
  const outputPath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (fs.existsSync(outputPath)) {
    console.log(`\n  \x1b[33m[warn]\x1b[0m 이미 존재하는 포스트입니다: ${slug}.mdx`);
    console.log(`  덮어쓰시겠습니까? (기존 파일이 대체됩니다)`);
    // Overwrite anyway for automation
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }

  fs.writeFileSync(outputPath, finalContent, "utf-8");

  console.log("");
  console.log(`  \x1b[32m✓\x1b[0m Published → src/content/blog/${slug}.mdx`);
  console.log(`  \x1b[32m✓\x1b[0m Images    → public/blog/${slug}/ (${imageFiles.length} files)`);

  // ─── Git commit & push ─────────────────────────────────
  console.log("");
  console.log("  \x1b[1m🚀 Deploying...\x1b[0m");

  try {
    execSync(`git add "src/content/blog/${slug}.mdx" "public/blog/${slug}/"`, { cwd: ROOT, stdio: "pipe" });

    // Check if there are staged changes
    const diff = execSync("git diff --cached --name-only", { cwd: ROOT, encoding: "utf-8" }).trim();
    if (!diff) {
      console.log(`  \x1b[33m⚠\x1b[0m 변경사항 없음 — 이미 최신 상태입니다.`);
    } else {
      execSync(`git commit -m "post: ${title}"`, { cwd: ROOT, stdio: "pipe" });
      console.log(`  \x1b[32m✓\x1b[0m Committed`);

      execSync("git push", { cwd: ROOT, stdio: "pipe" });
      console.log(`  \x1b[32m✓\x1b[0m Pushed → Vercel 배포 시작`);
    }
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m Git 오류: ${err.stderr?.toString().trim() || err.message}`);
    console.log(`  수동으로 커밋/푸시 해주세요.`);
  }

  console.log("");
  console.log(`  \x1b[32m Done!\x1b[0m https://riccilab-dev.vercel.app/blog/${encodeURIComponent(slug)}`);
  console.log("");
}

function isPublished(folderName) {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  // Check if any published post might correspond to this folder
  return files.some((f) => {
    const content = fs.readFileSync(path.join(CONTENT_DIR, f), "utf-8");
    return content.includes(folderName);
  });
}

main();

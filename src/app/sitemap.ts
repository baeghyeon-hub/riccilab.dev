import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAllProjects } from "@/lib/projects";
import { getCategoryTree, flattenTree } from "@/lib/categories";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600; // 1시간마다 갱신

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, blogCatTree, projectCatTree] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
    getCategoryTree("blog"),
    getCategoryTree("projects"),
  ]);

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: project.date ? new Date(project.date) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogCategoryEntries: MetadataRoute.Sitemap = flattenTree(blogCatTree).map(
    (node) => ({
      url: `${BASE_URL}/blog/categories/${node.path.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  const projectCategoryEntries: MetadataRoute.Sitemap = flattenTree(
    projectCatTree
  ).map((node) => ({
    url: `${BASE_URL}/projects/categories/${node.path.join("/")}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...blogEntries,
    ...projectEntries,
    ...blogCategoryEntries,
    ...projectCategoryEntries,
  ];
}

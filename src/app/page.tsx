import { PageWrapper } from "@/components/landing/PageWrapper";
import { getAllPosts } from "@/lib/blog";
import { getFeaturedProjects } from "@/lib/projects";

export default async function Home() {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    getFeaturedProjects(),
  ]);

  return <PageWrapper posts={posts} projects={projects} />;
}

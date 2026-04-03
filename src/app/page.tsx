import { PageWrapper } from "@/components/landing/PageWrapper";
import { getAllPosts } from "@/lib/blog";

export default async function Home() {
  const posts = await getAllPosts();

  return <PageWrapper posts={posts} />;
}

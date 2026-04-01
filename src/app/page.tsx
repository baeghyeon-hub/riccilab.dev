import { PageWrapper } from "@/components/landing/PageWrapper";
import { getAllPosts } from "@/lib/blog";

export default function Home() {
  const posts = getAllPosts();

  return <PageWrapper posts={posts} />;
}

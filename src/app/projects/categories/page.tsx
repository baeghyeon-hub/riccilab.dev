import { redirect } from "next/navigation";

// /projects is now the canonical categories landing. This alias exists for
// legacy inbound links and gets permanently redirected.
export default function ProjectsCategoriesPage() {
  redirect("/projects");
}

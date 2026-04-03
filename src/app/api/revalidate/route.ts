import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { secret } = body as { secret?: string };

  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("notion-posts", "max");
  revalidateTag("notion-post", "max");

  return Response.json({ revalidated: true, now: Date.now() });
}

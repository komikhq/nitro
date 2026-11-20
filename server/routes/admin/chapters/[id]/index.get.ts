import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { chapters, chapterPages } from "@/server/db";
import { eq, asc } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminGetChapter",
    summary: "Get chapter details with pages",
    description: "Returns chapter metadata and ordered pages. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Chapter ID" },
    ],
    responses: {
      200: {
        description: "Chapter details retrieved successfully.",
      },
      404: { description: "Chapter not found." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));

  if (!chapter) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  const rawPages = await db
    .select()
    .from(chapterPages)
    .where(eq(chapterPages.chapterId, id))
    .orderBy(asc(chapterPages.pageNumber));

  const pages = rawPages.map((p) => ({
    ...p,
    imageUrl: toPublicUrl(p.imageUrl, "media", env) ?? p.imageUrl,
  }));

  const data = {
    chapter,
    pages,
    ...chapter,
  };

  return {
    status: "ok",
    success: true,
    data,
    ...data,
  };
});

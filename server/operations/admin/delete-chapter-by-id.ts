import { chapters, chapterPages, comics, type DbClient } from "@/server/db";
import { eq, count } from "drizzle-orm";
import { deleteFromR2, type StorageEnv } from "@/server/lib/storage";

export async function deleteChapterById(db: DbClient, id: string, env?: StorageEnv) {
  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, id));
  if (!chapter) return null;

  // Cleanup R2 page images if env is provided
  if (env) {
    try {
      const pages = await db
        .select({ imageUrl: chapterPages.imageUrl })
        .from(chapterPages)
        .where(eq(chapterPages.chapterId, id));

      for (const p of pages) {
        if (p.imageUrl) {
          await deleteFromR2(env, "media", p.imageUrl).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("[deleteChapterById] Failed to delete page images from R2:", e);
    }
  }

  await db.delete(chapters).where(eq(chapters.id, id));

  // Recount and update parent comic totalChapters
  const [{ value }] = await db
    .select({ value: count() })
    .from(chapters)
    .where(eq(chapters.comicId, chapter.comicId));

  await db
    .update(comics)
    .set({ totalChapters: value, updatedAt: new Date() })
    .where(eq(comics.id, chapter.comicId));

  return chapter;
}

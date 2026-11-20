import { comics, chapters, chapterPages, type DbClient } from "@/server/db";
import { eq, inArray } from "drizzle-orm";
import { deleteFromR2, type StorageEnv } from "@/server/lib/storage";

export async function deleteComicById(db: DbClient, id: string, env?: StorageEnv) {
  const [existingComic] = await db
    .select()
    .from(comics)
    .where(eq(comics.id, id));

  if (!existingComic) return null;

  // Cleanup R2 assets if env is provided
  if (env) {
    try {
      const comicChapters = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.comicId, id));

      const chapterIds = comicChapters.map((c) => c.id);
      if (chapterIds.length > 0) {
        const pages = await db
          .select({ imageUrl: chapterPages.imageUrl })
          .from(chapterPages)
          .where(inArray(chapterPages.chapterId, chapterIds));

        for (const p of pages) {
          if (p.imageUrl) {
            await deleteFromR2(env, "media", p.imageUrl).catch(() => {});
          }
        }
      }

      if (existingComic.coverUrl) {
        await deleteFromR2(env, "media", existingComic.coverUrl).catch(() => {});
      }
      if (existingComic.bannerUrl) {
        await deleteFromR2(env, "media", existingComic.bannerUrl).catch(() => {});
      }
    } catch (e) {
      console.warn("[deleteComicById] Failed to delete R2 media assets:", e);
    }
  }

  const [deleted] = await db.delete(comics).where(eq(comics.id, id)).returning();
  return deleted;
}

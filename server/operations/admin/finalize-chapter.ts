import { chapters, comics, type DbClient } from "@/server/db";
import { eq, count } from "drizzle-orm";

export async function finalizeChapter(db: DbClient, chapterId: string, totalPages: number) {
  // Update chapter totalPages and updatedAt
  const [chapter] = await db
    .update(chapters)
    .set({ totalPages, updatedAt: new Date() })
    .where(eq(chapters.id, chapterId))
    .returning();

  if (!chapter) {
    return null;
  }

  // Count and update parent comic totalChapters
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

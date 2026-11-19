import { chapters, chapterPages, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export async function createChapterPages(
  db: DbClient,
  chapterId: string,
  pages: { pageNumber: number; imageUrl: string; width?: number; height?: number }[],
) {
  // Clear existing pages for this chapter before inserting updated order
  await db.delete(chapterPages).where(eq(chapterPages.chapterId, chapterId));

  if (pages.length > 0) {
    await db.insert(chapterPages).values(
      pages.map((p) => ({
        chapterId,
        pageNumber: p.pageNumber,
        imageUrl: p.imageUrl,
        width: p.width || null,
        height: p.height || null,
      })),
    );
  }

  // Update totalPages on chapter record
  await db
    .update(chapters)
    .set({ totalPages: pages.length, updatedAt: new Date() })
    .where(eq(chapters.id, chapterId));

  return { totalPages: pages.length };
}

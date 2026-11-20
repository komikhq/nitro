import { readingHistories, comics, chapters, type DbClient } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findHistoryManyByUser(
  db: DbClient,
  userId: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const result = await db
    .select({
      id: readingHistories.id,
      comicId: readingHistories.comicId,
      chapterId: readingHistories.chapterId,
      lastReadPage: readingHistories.lastReadPage,
      snapshotTotalPages: readingHistories.snapshotTotalPages,
      isCompleted: readingHistories.isCompleted,
      lastReadAt: readingHistories.lastReadAt,
      comicTitle: comics.title,
      comicSlug: comics.slug,
      comicCoverUrl: comics.coverUrl,
      chapterNumber: chapters.chapterNumber,
      chapterTitle: chapters.title,
      chapterSlug: chapters.slug,
    })
    .from(readingHistories)
    .innerJoin(comics, eq(readingHistories.comicId, comics.id))
    .innerJoin(chapters, eq(readingHistories.chapterId, chapters.id))
    .where(eq(readingHistories.userId, userId))
    .orderBy(desc(readingHistories.lastReadAt));

  return result.map((h) => ({
    id: h.id,
    comicId: h.comicId,
    chapterId: h.chapterId,
    lastReadPage: h.lastReadPage,
    lastPage: h.lastReadPage,
    snapshotTotalPages: h.snapshotTotalPages,
    isCompleted: h.isCompleted,
    lastReadAt: h.lastReadAt,
    updatedAt: h.lastReadAt,
    comic: {
      id: h.comicId,
      title: h.comicTitle,
      slug: h.comicSlug,
      coverUrl: toPublicUrl(h.comicCoverUrl, "media", storageEnv || {}) ?? h.comicCoverUrl,
    },
    chapter: {
      id: h.chapterId,
      number: h.chapterNumber,
      chapterNumber: h.chapterNumber,
      title: h.chapterTitle,
      slug: h.chapterSlug,
    },
  }));
}

import { readingHistories, comics, chapters, type DbClient } from "@/server/db";
import { and, eq, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UpsertHistoryParams {
  userId: string;
  comicId: string;
  chapterId: string;
  lastReadPage: number;
  snapshotTotalPages: number;
  isCompleted?: boolean;
}

export async function upsertHistoryProgress(db: DbClient, params: UpsertHistoryParams) {
  let { userId, comicId, chapterId, lastReadPage, snapshotTotalPages, isCompleted = false } = params;

  const isComicUuid = UUID_REGEX.test(comicId);
  const comicCondition = isComicUuid
    ? or(eq(comics.id, comicId), eq(comics.slug, comicId))
    : eq(comics.slug, comicId);

  const [comic] = await db.select({ id: comics.id }).from(comics).where(comicCondition);
  if (comic) {
    comicId = comic.id;
  }

  const isChapterUuid = UUID_REGEX.test(chapterId);
  if (!isChapterUuid) {
    const [chapter] = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(and(eq(chapters.comicId, comicId), eq(chapters.slug, chapterId)));
    if (chapter) {
      chapterId = chapter.id;
    }
  }

  const [existingChapter] = await db
    .select()
    .from(readingHistories)
    .where(and(eq(readingHistories.userId, userId), eq(readingHistories.chapterId, chapterId)));

  if (existingChapter) {
    const [updated] = await db
      .update(readingHistories)
      .set({
        comicId,
        lastReadPage,
        snapshotTotalPages,
        isCompleted,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(readingHistories.id, existingChapter.id))
      .returning();
    return updated;
  }

  const [existingComic] = await db
    .select()
    .from(readingHistories)
    .where(and(eq(readingHistories.userId, userId), eq(readingHistories.comicId, comicId)));

  if (existingComic) {
    const [updated] = await db
      .update(readingHistories)
      .set({
        chapterId,
        lastReadPage,
        snapshotTotalPages,
        isCompleted,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(readingHistories.id, existingComic.id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(readingHistories)
    .values({
      userId,
      comicId,
      chapterId,
      lastReadPage,
      snapshotTotalPages,
      isCompleted,
    })
    .returning();
  return inserted;
}

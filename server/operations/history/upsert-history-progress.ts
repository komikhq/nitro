import { readingHistories, type DbClient } from "@/server/db";
import { and, eq } from "drizzle-orm";

export interface UpsertHistoryParams {
  userId: string;
  comicId: string;
  chapterId: string;
  lastReadPage: number;
  snapshotTotalPages: number;
  isCompleted?: boolean;
}

export async function upsertHistoryProgress(db: DbClient, params: UpsertHistoryParams) {
  const { userId, comicId, chapterId, lastReadPage, snapshotTotalPages, isCompleted = false } = params;

  const [existing] = await db
    .select()
    .from(readingHistories)
    .where(and(eq(readingHistories.userId, userId), eq(readingHistories.chapterId, chapterId)));

  if (existing) {
    const [updated] = await db
      .update(readingHistories)
      .set({
        lastReadPage,
        snapshotTotalPages,
        isCompleted,
        lastReadAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(readingHistories.id, existing.id))
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

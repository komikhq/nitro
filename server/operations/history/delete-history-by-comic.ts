import { readingHistories, type DbClient } from "@/server/db";
import { and, eq } from "drizzle-orm";

export async function deleteHistoryByComic(db: DbClient, userId: string, comicId: string) {
  const result = await db
    .delete(readingHistories)
    .where(and(eq(readingHistories.userId, userId), eq(readingHistories.comicId, comicId)))
    .returning();

  return result.length > 0;
}

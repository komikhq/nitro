import { readingHistories, comics, type DbClient } from "@/server/db";
import { and, eq, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function deleteHistoryByComic(db: DbClient, userId: string, comicId: string) {
  const isUuid = UUID_REGEX.test(comicId);
  const comicCondition = isUuid
    ? or(eq(comics.id, comicId), eq(comics.slug, comicId))
    : eq(comics.slug, comicId);

  const [comic] = await db.select({ id: comics.id }).from(comics).where(comicCondition);
  const targetComicId = comic ? comic.id : (isUuid ? comicId : null);

  if (!targetComicId) return false;

  const result = await db
    .delete(readingHistories)
    .where(and(eq(readingHistories.userId, userId), eq(readingHistories.comicId, targetComicId)))
    .returning();

  return result.length > 0;
}

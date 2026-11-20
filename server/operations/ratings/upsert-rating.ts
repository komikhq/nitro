import { ratings, comics, type DbClient } from "@/server/db";
import { and, eq, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function upsertRating(
  db: DbClient,
  userId: string,
  comicId: string,
  score: number,
  reviewText?: string,
) {
  const isUuid = UUID_REGEX.test(comicId);
  const comicCondition = isUuid
    ? or(eq(comics.id, comicId), eq(comics.slug, comicId))
    : eq(comics.slug, comicId);

  const [comic] = await db.select({ id: comics.id }).from(comics).where(comicCondition);
  const targetComicId = comic ? comic.id : comicId;

  const [existing] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.comicId, targetComicId)));

  if (existing) {
    const [updated] = await db
      .update(ratings)
      .set({
        score,
        reviewText: reviewText || null,
        updatedAt: new Date(),
      })
      .where(eq(ratings.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(ratings)
    .values({
      userId,
      comicId: targetComicId,
      score,
      reviewText: reviewText || null,
    })
    .returning();
  return inserted;
}

import { ratings, type DbClient } from "@/server/db";
import { and, eq } from "drizzle-orm";

export async function upsertRating(
  db: DbClient,
  userId: string,
  comicId: string,
  score: number,
  reviewText?: string,
) {
  const [existing] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.userId, userId), eq(ratings.comicId, comicId)));

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
      comicId,
      score,
      reviewText: reviewText || null,
    })
    .returning();
  return inserted;
}

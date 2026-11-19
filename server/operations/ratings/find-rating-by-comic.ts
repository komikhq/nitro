import { ratings, type DbClient } from "@/server/db";
import { and, eq, sql } from "drizzle-orm";

export async function findRatingByComic(db: DbClient, comicId: string, userId?: string) {
  const [stats] = await db
    .select({
      averageScore: sql<number>`coalesce(avg(${ratings.score}), 0)`,
      totalRatings: sql<number>`count(${ratings.id})`,
    })
    .from(ratings)
    .where(eq(ratings.comicId, comicId));

  let userRating = null;
  if (userId) {
    const [found] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.comicId, comicId), eq(ratings.userId, userId)));
    userRating = found || null;
  }

  return {
    comicId,
    averageScore: Number(stats?.averageScore || 0),
    totalRatings: Number(stats?.totalRatings || 0),
    userRating,
  };
}

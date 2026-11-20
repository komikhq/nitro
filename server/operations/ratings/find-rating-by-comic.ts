import { ratings, comics, type DbClient } from "@/server/db";
import { and, eq, sql, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function findRatingByComic(db: DbClient, comicId: string, userId?: string) {
  const isUuid = UUID_REGEX.test(comicId);
  const comicCondition = isUuid
    ? or(eq(comics.id, comicId), eq(comics.slug, comicId))
    : eq(comics.slug, comicId);

  const [comic] = await db.select({ id: comics.id }).from(comics).where(comicCondition);
  const resolvedComicId = comic ? comic.id : (isUuid ? comicId : null);

  if (!resolvedComicId) {
    return {
      comicId,
      averageScore: 0,
      totalRatings: 0,
      userRating: null,
    };
  }

  const [stats] = await db
    .select({
      averageScore: sql<number>`coalesce(avg(${ratings.score}), 0)`,
      totalRatings: sql<number>`count(${ratings.id})`,
    })
    .from(ratings)
    .where(eq(ratings.comicId, resolvedComicId));

  let userRating = null;
  if (userId) {
    const [found] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.comicId, resolvedComicId), eq(ratings.userId, userId)));
    userRating = found || null;
  }

  return {
    comicId: resolvedComicId,
    averageScore: Number(stats?.averageScore || 0),
    totalRatings: Number(stats?.totalRatings || 0),
    userRating,
  };
}

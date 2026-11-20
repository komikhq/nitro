import { defineTask } from "nitro/task";
import { useDb } from "@/server/utils/db";
import { comics, comicGenres, genres, creators, comicCreators, type DbClient } from "@/server/db";
import { desc, inArray, eq } from "drizzle-orm";
import { queryAnalyticsEngine } from "@/server/utils/analytics-engine";

interface ComicRankingItem {
  comicId: string;
  views: number;
}

async function enrichRankedComics(
  db: DbClient,
  rankedList: { comicId: string; views: number }[],
) {
  if (rankedList.length === 0) return [];

  const comicIds = rankedList.map((r) => r.comicId);
  const periodViewCounts = new Map(rankedList.map((r) => [r.comicId, Number(r.views)]));

  const comicList = await db.select().from(comics).where(inArray(comics.id, comicIds));

  const comicMap = new Map(comicList.map((c) => [c.id, c]));
  const sortedComics = comicIds
    .map((id) => comicMap.get(id))
    .filter((c): c is typeof comics.$inferSelect => Boolean(c));

  const fetchedIds = sortedComics.map((c) => c.id);
  const comicGenresMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  const comicCreatorsMap: Record<string, string[]> = {};

  if (fetchedIds.length > 0) {
    const cgList = await db
      .select({
        comicId: comicGenres.comicId,
        genreId: genres.id,
        genreName: genres.name,
        genreSlug: genres.slug,
      })
      .from(comicGenres)
      .innerJoin(genres, eq(comicGenres.genreId, genres.id))
      .where(inArray(comicGenres.comicId, fetchedIds));

    for (const item of cgList) {
      if (!comicGenresMap[item.comicId]) comicGenresMap[item.comicId] = [];
      comicGenresMap[item.comicId].push({
        id: item.genreId,
        name: item.genreName,
        slug: item.genreSlug,
      });
    }

    const ccList = await db
      .select({ comicId: comicCreators.comicId, creatorName: creators.name })
      .from(comicCreators)
      .innerJoin(creators, eq(comicCreators.creatorId, creators.id))
      .where(inArray(comicCreators.comicId, fetchedIds));

    for (const item of ccList) {
      if (!comicCreatorsMap[item.comicId]) comicCreatorsMap[item.comicId] = [];
      comicCreatorsMap[item.comicId].push(item.creatorName);
    }
  }

  return sortedComics.map((item) => ({
    ...item,
    periodViews: periodViewCounts.get(item.id) ?? 0,
    genres: comicGenresMap[item.id] || [],
    creators: comicCreatorsMap[item.id] || [],
  }));
}

export default defineTask({
  meta: {
    name: "rankings:refresh",
    description: "Refresh popular & trending comic rankings and update KV cache",
  },
  async run({ context }) {
    console.log("[Task] Running rankings:refresh...");
    const env = (context as any)?.cloudflare?.env || (globalThis as any).__env__ || process.env;
    const db = useDb();

    let dailyRanked: ComicRankingItem[] = [];
    let weeklyRanked: ComicRankingItem[] = [];

    try {
      const dailyResult = await queryAnalyticsEngine<ComicRankingItem>(
        env,
        `SELECT blob1 AS comicId, SUM(_sample_interval) AS views
         FROM komikhq_views
         WHERE timestamp >= NOW() - INTERVAL '1' DAY
         GROUP BY comicId
         ORDER BY views DESC
         LIMIT 50`,
      );
      dailyRanked = dailyResult.data;
    } catch (err) {
      console.error("[Task rankings:refresh] Failed to fetch daily views from AE:", err);
    }

    try {
      const weeklyResult = await queryAnalyticsEngine<ComicRankingItem>(
        env,
        `SELECT blob1 AS comicId, SUM(_sample_interval) AS views
         FROM komikhq_views
         WHERE timestamp >= NOW() - INTERVAL '7' DAY
         GROUP BY comicId
         ORDER BY views DESC
         LIMIT 50`,
      );
      weeklyRanked = weeklyResult.data;
    } catch (err) {
      console.error("[Task rankings:refresh] Failed to fetch weekly views from AE:", err);
    }

    const popularComics = await db
      .select({ id: comics.id, totalViews: comics.totalViews })
      .from(comics)
      .orderBy(desc(comics.totalViews), desc(comics.createdAt))
      .limit(50);

    const popularRanked = popularComics.map((c) => ({
      comicId: c.id,
      views: c.totalViews,
    }));

    const [enrichedDaily, enrichedWeekly, enrichedPopular] = await Promise.all([
      enrichRankedComics(db, dailyRanked),
      enrichRankedComics(db, weeklyRanked),
      enrichRankedComics(db, popularRanked),
    ]);

    if (env?.KV_VIEWS) {
      try {
        if (enrichedDaily.length > 0) {
          await env.KV_VIEWS.put("ranking:trending_daily", JSON.stringify(enrichedDaily));
        }
        if (enrichedWeekly.length > 0) {
          await env.KV_VIEWS.put("ranking:trending_weekly", JSON.stringify(enrichedWeekly));
        }
        if (enrichedPopular.length > 0) {
          await env.KV_VIEWS.put("ranking:popular_all_time", JSON.stringify(enrichedPopular));
          await env.KV_VIEWS.put("rankings:popular", JSON.stringify(enrichedPopular), {
            expirationTtl: 86400,
          });
        }
      } catch (err) {
        console.warn("[Task rankings:refresh] Failed to write rankings to KV_VIEWS:", err);
      }
    }

    return {
      result: {
        dailyCount: enrichedDaily.length,
        weeklyCount: enrichedWeekly.length,
        popularCount: enrichedPopular.length,
      },
    };
  },
});

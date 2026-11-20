import { type DbClient } from "@/server/db";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";
import { findComicMany } from "./find-comic-many";

export async function findComicTrending(
  db: DbClient,
  limit: number = 10,
  storageEnv?: Partial<StorageEnv>,
  period: "daily" | "weekly" | "popular" = "daily",
  kvViews?: any,
) {
  if (kvViews) {
    try {
      const kvKey = period === "popular" ? "ranking:popular_all_time" : `ranking:trending_${period}`;
      const cachedRaw = await kvViews.get(kvKey);
      if (cachedRaw) {
        const cachedComics = JSON.parse(cachedRaw);
        if (Array.isArray(cachedComics) && cachedComics.length > 0) {
          const sliced = cachedComics.slice(0, limit);
          const enriched = sliced.map((c: any) => ({
            ...c,
            coverUrl: toPublicUrl(c.coverUrl, "media", storageEnv || {}) ?? c.coverUrl,
            bannerUrl: toPublicUrl(c.bannerUrl, "media", storageEnv || {}),
          }));
          return {
            comics: enriched,
            total: enriched.length,
          };
        }
      }
    } catch (err) {
      console.warn("[findComicTrending] Failed to read from KV_VIEWS, falling back to DB:", err);
    }
  }

  return findComicMany(
    db,
    {
      sort: "popular",
      page: 1,
      limit,
    },
    storageEnv,
  );
}

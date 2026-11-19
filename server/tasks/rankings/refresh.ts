import { defineTask } from "nitro/task";
import { useDb } from "@/server/utils/db";
import { comics } from "@/server/db";
import { desc } from "drizzle-orm";

export default defineTask({
  meta: {
    name: "rankings:refresh",
    description: "Refresh popular & trending comic rankings and update cache",
  },
  async run({ context }) {
    console.log("[Task] Running rankings:refresh...");
    const env = (context as any)?.cloudflare?.env || (globalThis as any).__env__;
    const db = useDb();

    // 1. Fetch top all-time popular comics from PostgreSQL
    const popularComics = await db
      .select({
        id: comics.id,
        title: comics.title,
        slug: comics.slug,
        coverUrl: comics.coverUrl,
        type: comics.type,
        status: comics.status,
        totalViews: comics.totalViews,
      })
      .from(comics)
      .orderBy(desc(comics.totalViews))
      .limit(50);

    // 2. Cache in Cloudflare KV if available
    if (env?.KV_VIEWS) {
      try {
        await env.KV_VIEWS.put("rankings:popular", JSON.stringify(popularComics), {
          expirationTtl: 86400, // 24 hours
        });
        console.log("[Task] rankings:refresh successfully updated KV_VIEWS");
      } catch (err) {
        console.warn("[Task] Failed to write rankings to KV_VIEWS:", err);
      }
    }

    return { result: { popularCount: popularComics.length } };
  },
});

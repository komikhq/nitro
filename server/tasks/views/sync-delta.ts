import { defineTask } from "nitro/task";
import { useDb } from "@/server/utils/db";
import { chapters, comics } from "@/server/db";
import { sql, and, eq } from "drizzle-orm";
import { queryAnalyticsEngine } from "@/server/utils/analytics-engine";

interface ChapterViewDelta {
  comicId: string;
  chapterId: string;
  newViews: number;
}

export default defineTask({
  meta: {
    name: "views:sync-delta",
    description: "Sync view counts from Analytics Engine into database",
  },
  async run({ context }) {
    console.log("[Task] Running views:sync-delta...");
    const env = (context as any)?.cloudflare?.env || (globalThis as any).__env__ || process.env;

    const KV_SYNC_KEY = "views_sync:last_synced_at";
    let lastSyncedAt: string | null = null;
    if (env?.KV_VIEWS) {
      try {
        lastSyncedAt = await env.KV_VIEWS.get(KV_SYNC_KEY);
      } catch (err) {
        console.warn("[Task views:sync-delta] Failed to read last synced at from KV:", err);
      }
    }
    if (!lastSyncedAt) {
      lastSyncedAt = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    }
    const nowIso = new Date().toISOString();

    const lastSyncedSql = new Date(lastSyncedAt).toISOString().replace("T", " ").slice(0, 19);
    const nowSql = new Date(nowIso).toISOString().replace("T", " ").slice(0, 19);

    let deltas: ChapterViewDelta[] = [];
    try {
      const result = await queryAnalyticsEngine<ChapterViewDelta>(
        env,
        `SELECT 
           blob1 AS comicId, 
           blob2 AS chapterId, 
           SUM(_sample_interval) AS newViews
         FROM komikhq_views
         WHERE timestamp >= toDateTime('${lastSyncedSql}') 
           AND timestamp < toDateTime('${nowSql}')
         GROUP BY comicId, chapterId`,
      );
      deltas = result.data;
    } catch (err) {
      console.error("[Task views:sync-delta] Failed to query deltas from AE:", err);
      return { result: { syncedChapters: 0, syncedComics: 0, totalViewsAdded: 0 } };
    }

    if (deltas.length === 0) {
      if (env?.KV_VIEWS) {
        try {
          await env.KV_VIEWS.put(KV_SYNC_KEY, nowIso);
        } catch {}
      }
      return { result: { syncedChapters: 0, syncedComics: 0, totalViewsAdded: 0 } };
    }

    const db = useDb();
    const comicTotalDeltas: Record<string, number> = {};
    let totalViewsAdded = 0;

    for (const delta of deltas) {
      const viewsCount = Number(delta.newViews);
      if (!delta.chapterId || !delta.comicId || viewsCount <= 0) continue;

      await db
        .update(chapters)
        .set({ totalViews: sql`${chapters.totalViews} + ${viewsCount}` })
        .where(and(eq(chapters.id, delta.chapterId), eq(chapters.comicId, delta.comicId)));

      comicTotalDeltas[delta.comicId] = (comicTotalDeltas[delta.comicId] || 0) + viewsCount;
      totalViewsAdded += viewsCount;
    }

    for (const [comicId, viewsToAdd] of Object.entries(comicTotalDeltas)) {
      await db
        .update(comics)
        .set({ totalViews: sql`${comics.totalViews} + ${viewsToAdd}` })
        .where(eq(comics.id, comicId));
    }

    if (env?.KV_VIEWS) {
      try {
        await env.KV_VIEWS.put(KV_SYNC_KEY, nowIso);
      } catch {}
    }

    return {
      result: {
        syncedChapters: deltas.length,
        syncedComics: Object.keys(comicTotalDeltas).length,
        totalViewsAdded,
      },
    };
  },
});

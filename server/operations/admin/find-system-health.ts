export async function findSystemHealth(env: any) {
  let cachedSearchKeysCount = 0;
  let kvHealthy = true;
  let kvViewsHealthy = true;
  const aeHealthy = Boolean(env.AE_COMIC_VIEWS);
  let r2Healthy = true;
  let lastSyncedAt: string | null = null;
  let cachedRankingsCount = 0;

  if (env.KV_KOMIKHQ) {
    try {
      const searchKeys = await env.KV_KOMIKHQ.list({
        prefix: "comic-search:suggestions:",
      });
      cachedSearchKeysCount = searchKeys.keys ? searchKeys.keys.length : 0;
    } catch {
      kvHealthy = false;
    }
  } else {
    kvHealthy = false;
  }

  if (env.KV_VIEWS) {
    try {
      lastSyncedAt = await env.KV_VIEWS.get("views_sync:last_synced_at");
      const rankingKeys = await env.KV_VIEWS.list({ prefix: "ranking:" });
      cachedRankingsCount = rankingKeys.keys ? rankingKeys.keys.length : 0;
    } catch {
      kvViewsHealthy = false;
    }
  } else {
    kvViewsHealthy = false;
  }

  const bucket = env.BUCKET_MEDIA || env.MEDIA_BUCKET;
  if (!bucket) {
    r2Healthy = false;
  }

  return {
    cachedSearchKeysCount,
    kvHealthy,
    kvViewsHealthy,
    aeHealthy,
    lastSyncedAt,
    cachedRankingsCount,
    r2Healthy,
    timestamp: new Date().toISOString(),
  };
}

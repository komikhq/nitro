import { comics, chapterPages, type DbClient } from "@/server/db";
import { isNotNull } from "drizzle-orm";
import { toObjectKey, type StorageEnv } from "@/server/lib/storage";

export async function purgeStorageOrphans(db: DbClient, env: StorageEnv) {
  const bucket = env.BUCKET_MEDIA || env.MEDIA_BUCKET;
  if (!bucket) {
    throw new Error("R2 bucket binding BUCKET_MEDIA is missing.");
  }

  // Collect all active image keys from DB
  const [activePages, activeComicsCovers, activeComicsBanners] = await Promise.all([
    db.select({ url: chapterPages.imageUrl }).from(chapterPages),
    db.select({ url: comics.coverUrl }).from(comics),
    db.select({ url: comics.bannerUrl }).from(comics).where(isNotNull(comics.bannerUrl)),
  ]);

  const normalizedKeys = new Set<string>();
  for (const row of activePages) {
    if (row.url) normalizedKeys.add(toObjectKey(row.url));
  }
  for (const row of activeComicsCovers) {
    if (row.url) normalizedKeys.add(toObjectKey(row.url));
  }
  for (const row of activeComicsBanners) {
    if (row.url) normalizedKeys.add(toObjectKey(row.url));
  }

  let truncated = true;
  let cursor: string | undefined = undefined;
  let purgedCount = 0;
  let totalSizeBytes = 0;

  // Ignore objects uploaded in the past hour to prevent deleting in-progress uploads
  const oneHourAgo = Date.now() - 3600 * 1000;

  while (truncated) {
    const listRes: R2Objects = await bucket.list({
      prefix: "comics/",
      cursor,
    });

    truncated = listRes.truncated;
    cursor = listRes.truncated ? listRes.cursor : undefined;

    for (const obj of listRes.objects) {
      if (obj.uploaded.getTime() > oneHourAgo) {
        continue;
      }

      if (!normalizedKeys.has(obj.key)) {
        await bucket.delete(obj.key);
        purgedCount++;
        totalSizeBytes += obj.size;
      }
    }

    if (!cursor) {
      break;
    }
  }

  const totalSizeMB = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));

  return {
    purgedCount,
    totalSizeBytes,
    totalSizeMB,
  };
}

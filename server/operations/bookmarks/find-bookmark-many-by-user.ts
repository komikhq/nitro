import { bookmarks, comics, type DbClient } from "@/server/db";
import { eq, desc, and } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findBookmarkManyByUser(
  db: DbClient,
  userId: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const result = await db
    .select({
      id: bookmarks.id,
      comicId: bookmarks.comicId,
      status: bookmarks.status,
      createdAt: bookmarks.createdAt,
      updatedAt: bookmarks.updatedAt,
      comicTitle: comics.title,
      comicSlug: comics.slug,
      comicCoverUrl: comics.coverUrl,
      comicType: comics.type,
      comicStatus: comics.status,
      comicTotalChapters: comics.totalChapters,
    })
    .from(bookmarks)
    .innerJoin(comics, eq(bookmarks.comicId, comics.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.updatedAt));

  return result.map((b) => ({
    id: b.id,
    comicId: b.comicId,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    comic: {
      id: b.comicId,
      title: b.comicTitle,
      slug: b.comicSlug,
      coverUrl: toPublicUrl(b.comicCoverUrl, "media", storageEnv || {}) ?? b.comicCoverUrl,
      type: b.comicType,
      status: b.comicStatus,
      totalChapters: b.comicTotalChapters,
    },
  }));
}

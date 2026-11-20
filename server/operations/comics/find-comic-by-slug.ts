import {
  comics,
  comicGenres,
  genres,
  creators,
  comicCreators,
  chapters,
  type DbClient,
} from "@/server/db";
import { eq, or, asc } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findComicBySlug(
  db: DbClient,
  slug: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const [comic] = await db
    .select()
    .from(comics)
    .where(isUuid ? or(eq(comics.slug, slug), eq(comics.id, slug)) : eq(comics.slug, slug));

  if (!comic) return null;

  const linkedGenres = await db
    .select({ id: genres.id, name: genres.name, slug: genres.slug })
    .from(comicGenres)
    .innerJoin(genres, eq(comicGenres.genreId, genres.id))
    .where(eq(comicGenres.comicId, comic.id));

  const linkedCreators = await db
    .select({
      id: creators.id,
      name: creators.name,
      role: comicCreators.role,
    })
    .from(comicCreators)
    .innerJoin(creators, eq(comicCreators.creatorId, creators.id))
    .where(eq(comicCreators.comicId, comic.id));

  const comicChapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.comicId, comic.id))
    .orderBy(asc(chapters.chapterNumber));

  const comicObj = {
    ...comic,
    coverUrl: toPublicUrl(comic.coverUrl, "media", storageEnv || {}) ?? comic.coverUrl,
    bannerUrl: toPublicUrl(comic.bannerUrl, "media", storageEnv || {}),
    creators: linkedCreators.map((c) => c.name),
    genres: linkedGenres,
  };

  return {
    ...comicObj,
    comic: comicObj,
    genres: linkedGenres,
    creators: linkedCreators,
    chapters: comicChapters,
  };
}

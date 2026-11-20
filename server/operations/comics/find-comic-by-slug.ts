import {
  comics,
  comicGenres,
  genres,
  creators,
  comicCreators,
  chapters,
  type DbClient,
} from "@/server/db";
import { eq, asc } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findComicBySlug(
  db: DbClient,
  slug: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const [comic] = await db.select().from(comics).where(eq(comics.slug, slug));
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
  };

  return {
    ...comicObj,
    comic: comicObj,
    genres: linkedGenres,
    creators: linkedCreators,
    chapters: comicChapters,
  };
}

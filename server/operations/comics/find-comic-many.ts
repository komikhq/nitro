import {
  comics,
  comicGenres,
  genres,
  creators,
  comicCreators,
  chapters,
  type DbClient,
} from "@/server/db";
import { eq, like, or, and, count, desc, inArray } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export interface FindComicManyParams {
  q?: string;
  genre?: string;
  status?: string;
  type?: string;
  sort?: string;
  page: number;
  limit: number;
}

export async function findComicMany(
  db: DbClient,
  params: FindComicManyParams,
  storageEnv?: Partial<StorageEnv>,
) {
  const { q, genre, status, type, sort, page, limit } = params;
  const offset = (page - 1) * limit;

  let genreComicIds: string[] | null = null;
  if (genre && genre !== "all") {
    const matched = await db
      .select({ comicId: comicGenres.comicId })
      .from(comicGenres)
      .innerJoin(genres, eq(comicGenres.genreId, genres.id))
      .where(or(eq(genres.slug, genre), eq(genres.id, genre), like(genres.name, `%${genre}%`)));

    genreComicIds = Array.from(new Set(matched.map((m) => m.comicId)));
    if (genreComicIds.length === 0) {
      return { comics: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  const conditions: any[] = [];
  if (q) {
    conditions.push(or(like(comics.title, `%${q}%`), like(comics.slug, `%${q}%`)));
  }
  if (status && status !== "all") {
    conditions.push(eq(comics.status, status));
  }
  if (type && type !== "all") {
    conditions.push(eq(comics.type, type));
  }
  if (genreComicIds !== null) {
    conditions.push(inArray(comics.id, genreComicIds));
  }

  const whereConditions = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalRes] = await db.select({ count: count() }).from(comics).where(whereConditions);

  let orderByClause = desc(comics.createdAt);
  if (sort === "popular") {
    orderByClause = desc(comics.totalViews);
  } else if (sort === "updated") {
    orderByClause = desc(comics.updatedAt);
  }

  const comicList = await db
    .select()
    .from(comics)
    .where(whereConditions)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const comicIds = comicList.map((item) => item.id);
  const comicGenresMap: Record<string, { id: string; name: string; slug: string }[]> = {};
  const comicCreatorsMap: Record<string, string[]> = {};
  const comicLatestChapterMap: Record<
    string,
    {
      chapterNumber: string;
      slug: string;
      title: string | null;
      publishedAt: Date;
    }
  > = {};

  if (comicIds.length > 0) {
    const cgList = await db
      .select({
        comicId: comicGenres.comicId,
        genreId: genres.id,
        genreName: genres.name,
        genreSlug: genres.slug,
      })
      .from(comicGenres)
      .innerJoin(genres, eq(comicGenres.genreId, genres.id))
      .where(inArray(comicGenres.comicId, comicIds));

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
      .where(inArray(comicCreators.comicId, comicIds));

    for (const item of ccList) {
      if (!comicCreatorsMap[item.comicId]) comicCreatorsMap[item.comicId] = [];
      comicCreatorsMap[item.comicId].push(item.creatorName);
    }

    const chList = await db
      .select({
        comicId: chapters.comicId,
        chapterNumber: chapters.chapterNumber,
        slug: chapters.slug,
        title: chapters.title,
        publishedAt: chapters.publishedAt,
      })
      .from(chapters)
      .where(inArray(chapters.comicId, comicIds))
      .orderBy(desc(chapters.publishedAt), desc(chapters.chapterNumber));

    for (const ch of chList) {
      if (!comicLatestChapterMap[ch.comicId]) {
        comicLatestChapterMap[ch.comicId] = ch;
      }
    }
  }

  const total = totalRes?.count || 0;
  const enrichedComics = comicList.map((item) => ({
    ...item,
    coverUrl: toPublicUrl(item.coverUrl, "media", storageEnv || {}) ?? item.coverUrl,
    bannerUrl: toPublicUrl(item.bannerUrl, "media", storageEnv || {}),
    genres: comicGenresMap[item.id] || [],
    creators: comicCreatorsMap[item.id] || [],
    latestChapter: comicLatestChapterMap[item.id] || null,
  }));

  return {
    comics: enrichedComics,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

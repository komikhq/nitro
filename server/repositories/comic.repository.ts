import {
  comics,
  comicGenres,
  genres,
  creators,
  comicCreators,
  chapters,
  type DbClient,
} from "@/server/db";
import { eq, like, or, and, count, desc, inArray, asc } from "drizzle-orm";

export interface ListComicsParams {
  q?: string;
  genre?: string;
  status?: string;
  type?: string;
  sort?: string;
  page: number;
  limit: number;
}

export class ComicRepository {
  constructor(private db: DbClient) {}

  async findManyWithPagination(params: ListComicsParams) {
    const { q, genre, status, type, sort, page, limit } = params;
    const offset = (page - 1) * limit;

    let genreComicIds: string[] | null = null;
    if (genre && genre !== "all") {
      const matched = await this.db
        .select({ comicId: comicGenres.comicId })
        .from(comicGenres)
        .innerJoin(genres, eq(comicGenres.genreId, genres.id))
        .where(or(eq(genres.slug, genre), eq(genres.id, genre), like(genres.name, `%${genre}%`)));

      genreComicIds = Array.from(new Set(matched.map((m) => m.comicId)));
      if (genreComicIds.length === 0) {
        return { comics: [], total: 0 };
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
    const [totalRes] = await this.db.select({ count: count() }).from(comics).where(whereConditions);

    let orderByClause = desc(comics.createdAt);
    if (sort === "popular") {
      orderByClause = desc(comics.totalViews);
    } else if (sort === "updated") {
      orderByClause = desc(comics.updatedAt);
    }

    const comicList = await this.db
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
      const cgList = await this.db
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

      const ccList = await this.db
        .select({ comicId: comicCreators.comicId, creatorName: creators.name })
        .from(comicCreators)
        .innerJoin(creators, eq(comicCreators.creatorId, creators.id))
        .where(inArray(comicCreators.comicId, comicIds));

      for (const item of ccList) {
        if (!comicCreatorsMap[item.comicId]) comicCreatorsMap[item.comicId] = [];
        comicCreatorsMap[item.comicId].push(item.creatorName);
      }

      const chList = await this.db
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

    const enrichedComics = comicList.map((item) => ({
      ...item,
      genres: comicGenresMap[item.id] || [],
      creators: comicCreatorsMap[item.id] || [],
      latestChapter: comicLatestChapterMap[item.id] || null,
    }));

    return {
      comics: enrichedComics,
      total: totalRes?.count || 0,
    };
  }

  async findBySlug(slug: string) {
    const [comic] = await this.db.select().from(comics).where(eq(comics.slug, slug));
    if (!comic) return null;

    const linkedGenres = await this.db
      .select({ id: genres.id, name: genres.name, slug: genres.slug })
      .from(comicGenres)
      .innerJoin(genres, eq(comicGenres.genreId, genres.id))
      .where(eq(comicGenres.comicId, comic.id));

    const linkedCreators = await this.db
      .select({
        id: creators.id,
        name: creators.name,
        role: comicCreators.role,
      })
      .from(comicCreators)
      .innerJoin(creators, eq(comicCreators.creatorId, creators.id))
      .where(eq(comicCreators.comicId, comic.id));

    const comicChapters = await this.db
      .select()
      .from(chapters)
      .where(eq(chapters.comicId, comic.id))
      .orderBy(asc(chapters.chapterNumber));

    return {
      comic,
      genres: linkedGenres,
      creators: linkedCreators,
      chapters: comicChapters,
    };
  }

  async findTrending(limit: number = 10) {
    return this.findManyWithPagination({
      sort: "popular",
      page: 1,
      limit,
    });
  }
}

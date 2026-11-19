import { comics, comicGenres, comicCreators, type DbClient } from "@/server/db";
import { eq, inArray } from "drizzle-orm";

export interface CreateComicParams {
  title: string;
  slug: string;
  synopsis?: string;
  coverUrl: string;
  bannerUrl?: string;
  alternateTitles?: string[];
  type?: string;
  status?: string;
  accessTier?: string;
  genreIds?: string[];
  creatorIds?: { creatorId: string; role?: string }[];
}

export async function createComic(db: DbClient, params: CreateComicParams) {
  const [comic] = await db
    .insert(comics)
    .values({
      title: params.title,
      slug: params.slug,
      synopsis: params.synopsis || null,
      coverUrl: params.coverUrl,
      bannerUrl: params.bannerUrl || null,
      alternateTitles: params.alternateTitles || [],
      type: params.type || "manga",
      status: params.status || "ongoing",
      accessTier: params.accessTier || "free",
    })
    .returning();

  if (params.genreIds && params.genreIds.length > 0) {
    await db.insert(comicGenres).values(
      params.genreIds.map((genreId) => ({
        comicId: comic.id,
        genreId,
      })),
    );
  }

  if (params.creatorIds && params.creatorIds.length > 0) {
    await db.insert(comicCreators).values(
      params.creatorIds.map((c) => ({
        comicId: comic.id,
        creatorId: c.creatorId,
        role: c.role || "author",
      })),
    );
  }

  return comic;
}

import { comics, comicGenres, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";
import { syncCreator } from "./sync-creator";

export interface UpdateComicParams {
  title?: string;
  slug?: string;
  synopsis?: string;
  coverUrl?: string;
  bannerUrl?: string;
  alternateTitles?: string[];
  type?: string;
  status?: string;
  accessTier?: string;
  genreIds?: string[];
  creatorName?: string;
}

export async function updateComicById(db: DbClient, id: string, params: UpdateComicParams) {
  const { genreIds, creatorName, ...updateFields } = params;

  const [comic] = await db
    .update(comics)
    .set({
      ...updateFields,
      updatedAt: new Date(),
    })
    .where(eq(comics.id, id))
    .returning();

  if (genreIds) {
    await db.delete(comicGenres).where(eq(comicGenres.comicId, id));
    if (genreIds.length > 0) {
      await db.insert(comicGenres).values(
        genreIds.map((genreId) => ({
          comicId: id,
          genreId,
        })),
      );
    }
  }

  if (creatorName !== undefined) {
    await syncCreator(db, id, creatorName);
  }

  return comic;
}

import { chapters, comics, type DbClient } from "@/server/db";
import { eq, count } from "drizzle-orm";

export interface CreateChapterParams {
  comicId: string;
  chapterNumber: string;
  title?: string;
  slug: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
}

export async function createChapter(db: DbClient, params: CreateChapterParams) {
  const [chapter] = await db
    .insert(chapters)
    .values({
      comicId: params.comicId,
      chapterNumber: params.chapterNumber,
      title: params.title || null,
      slug: params.slug,
      accessTier: params.accessTier || null,
      isEarlyAccess: params.isEarlyAccess || false,
    })
    .returning();

  // Recount and update totalChapters on parent comic
  const [{ value }] = await db
    .select({ value: count() })
    .from(chapters)
    .where(eq(chapters.comicId, params.comicId));

  await db
    .update(comics)
    .set({ totalChapters: value, updatedAt: new Date() })
    .where(eq(comics.id, params.comicId));

  return chapter;
}

import { chapters, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

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

  return chapter;
}

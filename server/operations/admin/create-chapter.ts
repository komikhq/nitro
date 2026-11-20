import { chapters, comics, type DbClient } from "@/server/db";
import { eq, count, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreateChapterParams {
  comicId: string;
  chapterNumber: string;
  title?: string;
  slug: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
}

export async function createChapter(db: DbClient, params: CreateChapterParams) {
  const isUuid = UUID_REGEX.test(params.comicId);
  const comicCondition = isUuid
    ? or(eq(comics.id, params.comicId), eq(comics.slug, params.comicId))
    : eq(comics.slug, params.comicId);

  const [comic] = await db
    .select({ id: comics.id, slug: comics.slug })
    .from(comics)
    .where(comicCondition);

  if (!comic) {
    throw new Error("Comic not found.");
  }

  const [chapter] = await db
    .insert(chapters)
    .values({
      comicId: comic.id,
      chapterNumber: params.chapterNumber,
      title: params.title || null,
      slug: params.slug || `ch-${params.chapterNumber}`,
      accessTier: params.accessTier || null,
      isEarlyAccess: params.isEarlyAccess || false,
    })
    .returning();

  // Recount and update totalChapters on parent comic
  const [{ value }] = await db
    .select({ value: count() })
    .from(chapters)
    .where(eq(chapters.comicId, comic.id));

  await db
    .update(comics)
    .set({ totalChapters: value, updatedAt: new Date() })
    .where(eq(comics.id, comic.id));

  return chapter;
}

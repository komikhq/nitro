import { chapters, comics, type DbClient } from "@/server/db";
import { eq, and, count, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface InitializeChapterParams {
  comicId: string;
  chapterNumber: string;
  title?: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
  totalPages?: number;
}

export async function initializeChapter(db: DbClient, params: InitializeChapterParams) {
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

  const [existing] = await db
    .select()
    .from(chapters)
    .where(
      and(
        eq(chapters.comicId, comic.id),
        eq(chapters.chapterNumber, params.chapterNumber),
      ),
    );

  if (existing) {
    throw new Error(
      `Chapter ${params.chapterNumber} already exists for this comic. Please use a different chapter number.`,
    );
  }

  const slug = `ch-${params.chapterNumber}`;
  const title = params.title?.trim() || `Chapter ${params.chapterNumber}`;

  const [chapter] = await db
    .insert(chapters)
    .values({
      comicId: comic.id,
      chapterNumber: params.chapterNumber,
      title,
      slug,
      totalPages: params.totalPages || 0,
      accessTier: params.accessTier || "free",
      isEarlyAccess: params.isEarlyAccess || false,
    })
    .returning();

  // Recount total chapters for parent comic
  const [{ value }] = await db
    .select({ value: count() })
    .from(chapters)
    .where(eq(chapters.comicId, comic.id));

  await db
    .update(comics)
    .set({ totalChapters: value, updatedAt: new Date() })
    .where(eq(comics.id, comic.id));

  return {
    ...chapter,
    comicSlug: comic.slug,
  };
}

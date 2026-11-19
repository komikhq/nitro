import { chapters, chapterPages, comics, type DbClient } from "@/server/db";
import { eq, asc, and } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findChapterReaderPages(
  db: DbClient,
  comicSlug: string,
  chapterSlug: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const [comic] = await db.select().from(comics).where(eq(comics.slug, comicSlug));
  if (!comic) return null;

  const [chapter] = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.comicId, comic.id), eq(chapters.slug, chapterSlug)));

  if (!chapter) return null;

  const pages = await db
    .select()
    .from(chapterPages)
    .where(eq(chapterPages.chapterId, chapter.id))
    .orderBy(asc(chapterPages.pageNumber));

  const allChapters = await db
    .select({
      id: chapters.id,
      chapterNumber: chapters.chapterNumber,
      slug: chapters.slug,
      title: chapters.title,
    })
    .from(chapters)
    .where(eq(chapters.comicId, comic.id))
    .orderBy(asc(chapters.chapterNumber));

  const enrichedPages = pages.map((p) => ({
    ...p,
    imageUrl: toPublicUrl(p.imageUrl, "media", storageEnv || {}) ?? p.imageUrl,
  }));

  return {
    comic: { id: comic.id, title: comic.title, slug: comic.slug },
    chapter,
    pages: enrichedPages,
    allChapters,
  };
}

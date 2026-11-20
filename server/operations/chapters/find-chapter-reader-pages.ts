import { chapters, chapterPages, comics, type DbClient } from "@/server/db";
import { eq, asc, and, or } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function findChapterReaderPages(
  db: DbClient,
  comicSlug: string,
  chapterSlug: string,
  storageEnv?: Partial<StorageEnv>,
) {
  const isUuid = UUID_REGEX.test(comicSlug);
  const comicCondition = isUuid
    ? or(eq(comics.id, comicSlug), eq(comics.slug, comicSlug))
    : eq(comics.slug, comicSlug);

  const [comic] = await db.select().from(comics).where(comicCondition);
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
    .where(eq(chapters.comicId, comic.id));

  allChapters.sort((a, b) => {
    const na = parseFloat(a.chapterNumber) || 0;
    const nb = parseFloat(b.chapterNumber) || 0;
    return na - nb;
  });

  const enrichedPages = pages.map((p) => ({
    ...p,
    imageUrl: toPublicUrl(p.imageUrl, "media", storageEnv || {}) ?? p.imageUrl,
  }));

  const currentIndex = allChapters.findIndex((ch) => ch.id === chapter.id || ch.slug === chapter.slug);
  const prev = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const prevChapter = prev
    ? {
        id: prev.id,
        slug: prev.slug,
        chapterNumber: String(prev.chapterNumber),
        title: prev.title || `Chapter ${prev.chapterNumber}`,
      }
    : null;

  const nextChapter = next
    ? {
        id: next.id,
        slug: next.slug,
        chapterNumber: String(next.chapterNumber),
        title: next.title || `Chapter ${next.chapterNumber}`,
      }
    : null;

  return {
    comic: {
      id: comic.id,
      title: comic.title,
      slug: comic.slug,
      coverUrl: toPublicUrl(comic.coverUrl, "media", storageEnv) ?? comic.coverUrl,
    },
    chapter,
    pages: enrichedPages,
    allChapters,
    prevChapter,
    nextChapter,
  };
}

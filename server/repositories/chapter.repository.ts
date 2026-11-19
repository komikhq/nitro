import { chapters, chapterPages, comics, type DbClient } from "@/server/db";
import { eq, asc, and } from "drizzle-orm";

export class ChapterRepository {
  constructor(private db: DbClient) {}

  async findByComicSlugAndChapterSlug(comicSlug: string, chapterSlug: string) {
    const [comic] = await this.db.select().from(comics).where(eq(comics.slug, comicSlug));
    if (!comic) return null;

    const [chapter] = await this.db
      .select()
      .from(chapters)
      .where(and(eq(chapters.comicId, comic.id), eq(chapters.slug, chapterSlug)));

    if (!chapter) return null;

    const pages = await this.db
      .select()
      .from(chapterPages)
      .where(eq(chapterPages.chapterId, chapter.id))
      .orderBy(asc(chapterPages.pageNumber));

    const allChapters = await this.db
      .select({
        id: chapters.id,
        chapterNumber: chapters.chapterNumber,
        slug: chapters.slug,
        title: chapters.title,
      })
      .from(chapters)
      .where(eq(chapters.comicId, comic.id))
      .orderBy(asc(chapters.chapterNumber));

    return {
      comic: { id: comic.id, title: comic.title, slug: comic.slug },
      chapter,
      pages,
      allChapters,
    };
  }
}

import { ChapterRepository } from "../repositories/chapter.repository";
import type { DbClient } from "@/server/db";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export class ChapterService {
  private repo: ChapterRepository;

  constructor(
    db: DbClient,
    private env?: Partial<StorageEnv>,
  ) {
    this.repo = new ChapterRepository(db);
  }

  async getChapterPages(comicSlug: string, chapterSlug: string) {
    const data = await this.repo.findByComicSlugAndChapterSlug(comicSlug, chapterSlug);
    if (!data) return null;

    const pages = data.pages.map((p) => ({
      ...p,
      imageUrl: toPublicUrl(p.imageUrl, "media", this.env || {}) ?? p.imageUrl,
    }));

    return {
      comic: data.comic,
      chapter: data.chapter,
      pages,
      allChapters: data.allChapters,
    };
  }
}

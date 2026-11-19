import { ComicRepository, type ListComicsParams } from "../repositories/comic.repository";
import type { DbClient } from "@/server/db";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export class ComicService {
  private repo: ComicRepository;

  constructor(
    db: DbClient,
    private env?: Partial<StorageEnv>,
  ) {
    this.repo = new ComicRepository(db);
  }

  async listComics(params: ListComicsParams) {
    const result = await this.repo.findManyWithPagination(params);

    const comics = result.comics.map((c) => ({
      ...c,
      coverUrl: toPublicUrl(c.coverUrl, "media", this.env || {}) ?? c.coverUrl,
      bannerUrl: toPublicUrl(c.bannerUrl, "media", this.env || {}),
    }));

    return {
      comics,
      total: result.total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(result.total / params.limit),
    };
  }

  async getComicBySlug(slug: string) {
    const data = await this.repo.findBySlug(slug);
    if (!data) return null;

    return {
      ...data.comic,
      coverUrl: toPublicUrl(data.comic.coverUrl, "media", this.env || {}) ?? data.comic.coverUrl,
      bannerUrl: toPublicUrl(data.comic.bannerUrl, "media", this.env || {}),
      genres: data.genres,
      creators: data.creators,
      chapters: data.chapters,
    };
  }

  async getTrending(limit: number = 10) {
    return this.listComics({
      sort: "popular",
      page: 1,
      limit,
    });
  }
}

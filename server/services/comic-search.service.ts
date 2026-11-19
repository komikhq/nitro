import { ComicSearchRepository } from "../repositories/comic-search.repository";
import type { DbClient } from "@/server/db";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export class ComicSearchService {
  private repo: ComicSearchRepository;

  constructor(
    db: DbClient,
    private env?: Partial<StorageEnv>,
  ) {
    this.repo = new ComicSearchRepository(db);
  }

  async getSuggestions(query: string, limit: number = 8) {
    const rawSuggestions = await this.repo.findSuggestions(query, limit);

    return rawSuggestions.map((item) => ({
      ...item,
      coverUrl: toPublicUrl(item.coverUrl, "media", this.env || {}) ?? item.coverUrl,
    }));
  }
}

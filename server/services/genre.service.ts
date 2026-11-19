import { GenreRepository } from "../repositories/genre.repository";
import type { DbClient } from "@/server/db";

export class GenreService {
  private repo: GenreRepository;

  constructor(db: DbClient) {
    this.repo = new GenreRepository(db);
  }

  async getAllGenres() {
    return this.repo.findAll();
  }

  async getGenreBySlug(slug: string) {
    return this.repo.findBySlug(slug);
  }
}

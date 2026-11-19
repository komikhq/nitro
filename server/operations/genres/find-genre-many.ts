import { genres, type DbClient } from "@/server/db";
import type { Genre } from "@/server/db/schema/genres";

const genreNameCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: false,
});

export function compareGenreNames(
  left: Pick<Genre, "id" | "name" | "slug">,
  right: Pick<Genre, "id" | "name" | "slug">,
) {
  return genreNameCollator.compare(left.name, right.name) || left.name.localeCompare(right.name);
}

export function sortGenres<T extends Pick<Genre, "id" | "name" | "slug">>(genreList: T[]) {
  return [...genreList].sort(compareGenreNames);
}

export async function findGenreMany(db: DbClient) {
  const genreList = await db.select().from(genres);
  return sortGenres(genreList);
}

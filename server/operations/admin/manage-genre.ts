import { genres, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export async function createGenre(db: DbClient, name: string, slug: string, description?: string) {
  const [genre] = await db
    .insert(genres)
    .values({ name, slug, description: description || null })
    .returning();
  return genre;
}

export async function updateGenreById(
  db: DbClient,
  id: string,
  params: { name?: string; slug?: string; description?: string },
) {
  const [updated] = await db
    .update(genres)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(genres.id, id))
    .returning();
  return updated;
}

export async function deleteGenreById(db: DbClient, id: string) {
  const [deleted] = await db.delete(genres).where(eq(genres.id, id)).returning();
  return Boolean(deleted);
}

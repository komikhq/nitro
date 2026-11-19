import { bookmarks, type DbClient } from "@/server/db";
import { and, eq } from "drizzle-orm";

export async function deleteBookmarkByComic(db: DbClient, userId: string, comicId: string) {
  const result = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.comicId, comicId)))
    .returning();

  return result.length > 0;
}

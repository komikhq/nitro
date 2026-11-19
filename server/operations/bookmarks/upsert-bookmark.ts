import { bookmarks, type DbClient } from "@/server/db";
import { and, eq } from "drizzle-orm";

export async function upsertBookmark(
  db: DbClient,
  userId: string,
  comicId: string,
  status: string = "reading",
) {
  const [existing] = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.comicId, comicId)));

  if (existing) {
    const [updated] = await db
      .update(bookmarks)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookmarks.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db
    .insert(bookmarks)
    .values({ userId, comicId, status })
    .returning();
  return inserted;
}

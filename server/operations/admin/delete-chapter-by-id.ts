import { chapters, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export async function deleteChapterById(db: DbClient, id: string) {
  const [deleted] = await db.delete(chapters).where(eq(chapters.id, id)).returning();
  return Boolean(deleted);
}

import { comics, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export async function deleteComicById(db: DbClient, id: string) {
  const [deleted] = await db.delete(comics).where(eq(comics.id, id)).returning();
  return Boolean(deleted);
}

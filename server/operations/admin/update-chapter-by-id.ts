import { chapters, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export interface UpdateChapterParams {
  chapterNumber?: string;
  title?: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
}

export async function updateChapterById(db: DbClient, id: string, params: UpdateChapterParams) {
  const [chapter] = await db
    .update(chapters)
    .set({
      ...params,
      updatedAt: new Date(),
    })
    .where(eq(chapters.id, id))
    .returning();

  return chapter;
}

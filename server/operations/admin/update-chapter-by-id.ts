import { chapters, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export interface UpdateChapterParams {
  chapterNumber?: string;
  title?: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
}

export async function updateChapterById(db: DbClient, id: string, params: UpdateChapterParams) {
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (params.title !== undefined) updateData.title = params.title;
  if (params.chapterNumber !== undefined) {
    updateData.chapterNumber = params.chapterNumber;
    updateData.slug = `ch-${params.chapterNumber}`;
  }
  if (params.accessTier !== undefined) updateData.accessTier = params.accessTier;
  if (params.isEarlyAccess !== undefined) updateData.isEarlyAccess = Boolean(params.isEarlyAccess);

  const [chapter] = await db
    .update(chapters)
    .set(updateData)
    .where(eq(chapters.id, id))
    .returning();

  return chapter;
}

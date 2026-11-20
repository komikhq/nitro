import { type DbClient } from "@/server/db";
import { createChapter, type CreateChapterParams } from "./create-chapter";

export interface InitializeChapterParams {
  comicId: string;
  chapterNumber: string;
  title?: string;
  accessTier?: string;
  isEarlyAccess?: boolean;
  totalPages?: number;
}

export async function initializeChapter(db: DbClient, params: InitializeChapterParams) {
  const slug = `ch-${params.chapterNumber}`;

  const createParams: CreateChapterParams = {
    comicId: params.comicId,
    chapterNumber: params.chapterNumber,
    slug,
    title: params.title,
    accessTier: params.accessTier,
    isEarlyAccess: params.isEarlyAccess,
  };

  const chapter = await createChapter(db, createParams);
  return chapter;
}

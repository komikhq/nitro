import { chapters, chapterPages, comics, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";
import { uploadToR2, toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export interface UploadChapterPageParams {
  chapterId: string;
  file: File;
  pageNumber: number;
  width?: number;
  height?: number;
}

function getExtFromContentType(ct: string): string {
  if (ct.includes("webp")) return "webp";
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("avif")) return "avif";
  return "jpg";
}

export async function uploadChapterPage(
  db: DbClient,
  env: StorageEnv,
  params: UploadChapterPageParams,
) {
  const [chapter] = await db
    .select({
      id: chapters.id,
      comicId: chapters.comicId,
      chapterNumber: chapters.chapterNumber,
    })
    .from(chapters)
    .where(eq(chapters.id, params.chapterId));

  if (!chapter) {
    throw new Error("Chapter not found.");
  }

  const [comic] = await db
    .select({
      id: comics.id,
      slug: comics.slug,
    })
    .from(comics)
    .where(eq(comics.id, chapter.comicId));

  if (!comic) {
    throw new Error("Parent comic not found.");
  }

  const ext = getExtFromContentType(params.file.type || "");
  const objectKey = `comics/${comic.slug}/ch-${chapter.chapterNumber}/page-${params.pageNumber}-${Date.now()}.${ext}`;
  const buffer = await params.file.arrayBuffer();

  await uploadToR2(env, "media", objectKey, buffer, {
    contentType: params.file.type || "image/jpeg",
  });

  const [page] = await db
    .insert(chapterPages)
    .values({
      chapterId: chapter.id,
      pageNumber: params.pageNumber,
      imageUrl: objectKey,
      width: params.width || null,
      height: params.height || null,
    })
    .returning();

  return {
    ...page,
    imageUrl: toPublicUrl(page.imageUrl, "media", env) ?? page.imageUrl,
    imageKey: objectKey,
  };
}

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

function getExt(file: File): string {
  if (file.type) {
    if (file.type.includes("webp")) return "webp";
    if (file.type.includes("png")) return "png";
    if (file.type.includes("gif")) return "gif";
    if (file.type.includes("avif")) return "avif";
    if (file.type.includes("jpeg") || file.type.includes("jpg")) return "jpg";
  }
  const nameExt = file.name?.split(".").pop()?.toLowerCase();
  if (nameExt && nameExt !== "blob" && ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(nameExt)) {
    return nameExt === "jpeg" ? "jpg" : nameExt;
  }
  return "webp";
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

  const ext = getExt(params.file);
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

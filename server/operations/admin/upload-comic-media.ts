import { uploadToR2, fetchImageFromUrl, type StorageEnv } from "@/server/lib/storage";

function getExtFromContentType(ct: string): string {
  if (ct.includes("webp")) return "webp";
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("avif")) return "avif";
  return "jpg";
}

export async function processComicCover(
  env: StorageEnv,
  slug: string,
  fileOrUrl: File | string,
): Promise<string> {
  if (fileOrUrl instanceof File) {
    const ext = getExtFromContentType(fileOrUrl.type || "");
    const key = `comics/covers/cover-${slug}-${Date.now()}.${ext}`;
    const buffer = await fileOrUrl.arrayBuffer();
    await uploadToR2(env, "media", key, buffer, { contentType: fileOrUrl.type });
    return key;
  }

  if (typeof fileOrUrl === "string" && /^https?:\/\//i.test(fileOrUrl)) {
    const { arrayBuffer, contentType, ext } = await fetchImageFromUrl(fileOrUrl);
    const key = `comics/covers/cover-${slug}-${Date.now()}.${ext}`;
    await uploadToR2(env, "media", key, arrayBuffer, { contentType });
    return key;
  }

  return fileOrUrl;
}

export async function processComicBanner(
  env: StorageEnv,
  slug: string,
  fileOrUrl: File | string,
): Promise<string> {
  if (fileOrUrl instanceof File) {
    const ext = getExtFromContentType(fileOrUrl.type || "");
    const key = `comics/banners/banner-${slug}-${Date.now()}.${ext}`;
    const buffer = await fileOrUrl.arrayBuffer();
    await uploadToR2(env, "media", key, buffer, { contentType: fileOrUrl.type });
    return key;
  }

  if (typeof fileOrUrl === "string" && /^https?:\/\//i.test(fileOrUrl)) {
    const { arrayBuffer, contentType, ext } = await fetchImageFromUrl(fileOrUrl);
    const key = `comics/banners/banner-${slug}-${Date.now()}.${ext}`;
    await uploadToR2(env, "media", key, arrayBuffer, { contentType });
    return key;
  }

  return fileOrUrl;
}

import { users, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";
import { uploadToR2, toPublicUrl, type StorageEnv } from "@/server/lib/storage";

function resolveAvatarExtension(file: File): string {
  const mime = file.type?.toLowerCase() || "";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("avif")) return "avif";

  const name = file.name || "";
  if (name.includes(".") && !name.toLowerCase().endsWith(".blob")) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext && ext !== "blob") return ext;
  }
  return "png";
}

export async function updateUserAvatar(
  db: DbClient,
  userId: string,
  file: File,
  env: StorageEnv,
) {
  const fileExt = resolveAvatarExtension(file);
  const objectKey = `avatars/${userId}-${Date.now()}.${fileExt}`;
  const buffer = await file.arrayBuffer();

  const contentType =
    file.type && !file.type.includes("octet-stream")
      ? file.type
      : fileExt === "jpg"
      ? "image/jpeg"
      : `image/${fileExt}`;

  const imageKey = await uploadToR2(env, "users", objectKey, buffer, {
    contentType,
  });

  await db
    .update(users)
    .set({
      image: imageKey,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return toPublicUrl(imageKey, "users", env) ?? imageKey;
}

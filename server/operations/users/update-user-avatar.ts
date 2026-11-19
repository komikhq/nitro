import { users, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";
import { uploadToR2, toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function updateUserAvatar(
  db: DbClient,
  userId: string,
  file: File,
  env: StorageEnv,
) {
  const fileExt = file.name ? file.name.split(".").pop() || "png" : "png";
  const objectKey = `avatars/${userId}-${Date.now()}.${fileExt}`;
  const buffer = await file.arrayBuffer();

  const imageKey = await uploadToR2(env, "users", objectKey, buffer, {
    contentType: file.type || "image/png",
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

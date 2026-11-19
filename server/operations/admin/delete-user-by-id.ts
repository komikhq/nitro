import { users, sessions, accounts, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";
import { deleteFromR2, type StorageEnv } from "@/server/lib/storage";

export async function deleteUserById(
  db: DbClient,
  env: StorageEnv,
  userId: string,
  currentUserId?: string,
) {
  if (userId === currentUserId) {
    throw new Error("You cannot delete your own account from the administrator panel.");
  }

  const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!existingUser) {
    throw new Error("User not found.");
  }

  // Delete R2 avatar if present
  if (existingUser.image && (env.BUCKET_USERS || env.USERS_BUCKET)) {
    try {
      await deleteFromR2(env, "users", existingUser.image);
    } catch (e) {
      console.error("[deleteUserById] Failed to delete R2 avatar:", e);
    }
  }

  // Delete sessions and accounts, then user
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return existingUser;
}

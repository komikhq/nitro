import { users, accounts, type DbClient } from "@/server/db";
import { eq, and, isNotNull } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export async function findUserProfile(db: DbClient, userId: string, env: Partial<StorageEnv>) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    return null;
  }

  const [credAccount] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, userId),
        eq(accounts.providerId, "credential"),
        isNotNull(accounts.password),
      ),
    );

  const hasPassword = Boolean(credAccount);

  return {
    user: {
      ...user,
      image: toPublicUrl(user.image, "users", env) ?? user.image,
    },
    hasPassword,
  };
}

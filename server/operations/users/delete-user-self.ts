import { users, accounts, sessions, type DbClient } from "@/server/db";
import { eq, and, isNotNull } from "drizzle-orm";

export interface DeleteUserSelfParams {
  password?: string;
  email?: string;
}

export async function deleteUserSelf(
  db: DbClient,
  auth: any,
  userId: string,
  userEmail: string,
  params: DeleteUserSelfParams,
  headers: Headers,
) {
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

  if (hasPassword) {
    if (!params.password) {
      throw new Error("Confirmation password is required.");
    }

    try {
      const isValid = await auth.api.verifyPassword({
        body: { password: params.password },
        headers,
      });

      if (!isValid) {
        throw new Error("Incorrect confirmation password.");
      }
    } catch (e: any) {
      throw new Error(e.message || "Invalid password entered.");
    }
  } else {
    if (!params.email || params.email.toLowerCase().trim() !== userEmail.toLowerCase().trim()) {
      throw new Error("Confirmation email does not match.");
    }
  }

  // Clear active sessions before removing user record
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return true;
}

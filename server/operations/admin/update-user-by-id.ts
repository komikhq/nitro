import { users, sessions, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export interface UpdateUserByIdParams {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

export async function updateUserById(
  db: DbClient,
  auth: any,
  userId: string,
  data: UpdateUserByIdParams,
  headers: Headers,
) {
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
  if (!existingUser) {
    throw new Error("User not found.");
  }

  const updateData: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;

  await db.update(users).set(updateData).where(eq(users.id, userId));

  // Invalidate user sessions in database
  await db.delete(sessions).where(eq(sessions.userId, userId));

  if (data.password && data.password.trim().length > 0) {
    if (data.password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    await auth.api.setUserPassword({
      body: {
        userId,
        newPassword: data.password.trim(),
      },
      headers,
    });
  }

  const [updated] = await db.select().from(users).where(eq(users.id, userId));
  return updated;
}

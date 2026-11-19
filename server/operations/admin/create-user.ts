import { users, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export interface CreateUserParams {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export async function createUser(auth: any, db: DbClient, data: CreateUserParams) {
  if (!data.name || !data.email || !data.password) {
    throw new Error("Name, email, and password are required.");
  }

  const newUser = await auth.api.signUpEmail({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
  });

  if (!newUser || !newUser.user) {
    throw new Error("Failed to create user via auth engine.");
  }

  const role = data.role || "user";
  if (role !== "user") {
    await db.update(users).set({ role }).where(eq(users.id, newUser.user.id));
  }

  return { ...newUser.user, role };
}

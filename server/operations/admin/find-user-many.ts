import { users, type DbClient } from "@/server/db";
import { count, desc, like, or } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export interface FindUserManyParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function findUserMany(
  db: DbClient,
  params: FindUserManyParams,
  env: Partial<StorageEnv>,
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  const searchCondition = params.query
    ? or(like(users.name, `%${params.query}%`), like(users.email, `%${params.query}%`))
    : undefined;

  const [totalRes] = await db.select({ count: count() }).from(users).where(searchCondition);
  const total = totalRes?.count || 0;

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      image: users.image,
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(searchCondition)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const resolvedUsers = userList.map((u) => ({
    ...u,
    image: toPublicUrl(u.image, "users", env) ?? u.image,
  }));

  return {
    items: resolvedUsers,
    users: resolvedUsers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

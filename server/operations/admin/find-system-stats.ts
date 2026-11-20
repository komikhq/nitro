import { users, comics, chapters, comments, type DbClient } from "@/server/db";
import { count, eq, sum } from "drizzle-orm";

export async function findSystemStats(db: DbClient) {
  const [
    [userCount],
    [adminCount],
    [comicCount],
    [chapterCount],
    [viewsSum],
    [commentCount],
  ] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.role, "admin")),
    db.select({ count: count() }).from(comics),
    db.select({ count: count() }).from(chapters),
    db.select({ sum: sum(comics.totalViews) }).from(comics),
    db.select({ count: count() }).from(comments),
  ]);

  return {
    totalUsers: userCount?.count || 0,
    totalAdmins: adminCount?.count || 0,
    totalComics: comicCount?.count || 0,
    totalChapters: chapterCount?.count || 0,
    totalViews: Number(viewsSum?.sum || 0),
    totalComments: commentCount?.count || 0,
  };
}

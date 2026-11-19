import { users, comics, chapters, comments, type DbClient } from "@/server/db";
import { count } from "drizzle-orm";

export async function findSystemStats(db: DbClient) {
  const [[userCount], [comicCount], [chapterCount], [commentCount]] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(comics),
    db.select({ count: count() }).from(chapters),
    db.select({ count: count() }).from(comments),
  ]);

  return {
    totalUsers: userCount?.count || 0,
    totalComics: comicCount?.count || 0,
    totalChapters: chapterCount?.count || 0,
    totalComments: commentCount?.count || 0,
  };
}

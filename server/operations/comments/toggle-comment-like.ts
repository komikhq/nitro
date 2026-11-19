import { comments, commentLikes, type DbClient } from "@/server/db";
import { and, eq, sql } from "drizzle-orm";

export async function toggleCommentLike(db: DbClient, commentId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

  if (existing) {
    await db
      .delete(commentLikes)
      .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));

    await db
      .update(comments)
      .set({ likeCount: sql`greatest(${comments.likeCount} - 1, 0)` })
      .where(eq(comments.id, commentId));

    return { liked: false };
  }

  await db.insert(commentLikes).values({ commentId, userId, isLike: true });

  await db
    .update(comments)
    .set({ likeCount: sql`${comments.likeCount} + 1` })
    .where(eq(comments.id, commentId));

  return { liked: true };
}

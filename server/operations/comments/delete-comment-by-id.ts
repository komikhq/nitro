import { comments, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export async function deleteCommentById(
  db: DbClient,
  commentId: string,
  userId: string,
  userRole?: string,
) {
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
  if (!comment) return false;

  // Allow author or admin
  if (comment.userId !== userId && userRole !== "admin") {
    return false;
  }

  await db
    .update(comments)
    .set({ isDeleted: true, content: "[Comment has been deleted]" })
    .where(eq(comments.id, commentId));

  return true;
}

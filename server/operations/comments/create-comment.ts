import { comments, commentMentions, type DbClient } from "@/server/db";
import { eq, sql } from "drizzle-orm";

export interface CreateCommentParams {
  comicId: string;
  chapterId?: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  content: string;
  isSpoiler?: boolean;
  parentId?: string;
  pageNumber?: number;
  mentionedUserIds?: string[];
}

export async function createComment(db: DbClient, params: CreateCommentParams) {
  let depth = 1;
  let rootId: string | null = null;
  let replyToUserId: string | null = null;

  if (params.parentId) {
    const [parent] = await db.select().from(comments).where(eq(comments.id, params.parentId));
    if (parent) {
      depth = Math.min((parent.depth || 1) + 1, 3);
      rootId = parent.rootId || parent.id;
      replyToUserId = parent.userId;
    }
  }

  const [newComment] = await db
    .insert(comments)
    .values({
      comicId: params.comicId,
      chapterId: params.chapterId || null,
      userId: params.userId || null,
      guestName: params.guestName || null,
      guestEmail: params.guestEmail || null,
      content: params.content,
      isSpoiler: params.isSpoiler || false,
      parentId: params.parentId || null,
      rootId: rootId || null,
      replyToUserId,
      depth,
      pageNumber: params.pageNumber || null,
    })
    .returning();

  if (params.parentId) {
    await db
      .update(comments)
      .set({ replyCount: sql`${comments.replyCount} + 1` })
      .where(eq(comments.id, params.parentId));
  }

  if (params.mentionedUserIds && params.mentionedUserIds.length > 0) {
    await db.insert(commentMentions).values(
      params.mentionedUserIds.map((uid) => ({
        commentId: newComment.id,
        mentionedUserId: uid,
      })),
    );
  }

  return newComment;
}

import { comments, users, commentLikes, type DbClient } from "@/server/db";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

export interface FindCommentsParams {
  comicId: string;
  chapterId?: string;
  currentUserId?: string;
}

export async function findCommentMany(
  db: DbClient,
  params: FindCommentsParams,
  storageEnv?: Partial<StorageEnv>,
) {
  const { comicId, chapterId, currentUserId } = params;

  const conditions = [eq(comments.comicId, comicId)];
  if (chapterId) {
    conditions.push(eq(comments.chapterId, chapterId));
  } else {
    conditions.push(isNull(comments.chapterId));
  }

  const rawComments = await db
    .select({
      id: comments.id,
      comicId: comments.comicId,
      chapterId: comments.chapterId,
      userId: comments.userId,
      guestName: comments.guestName,
      content: comments.content,
      isSpoiler: comments.isSpoiler,
      parentId: comments.parentId,
      rootId: comments.rootId,
      pageNumber: comments.pageNumber,
      likeCount: comments.likeCount,
      replyCount: comments.replyCount,
      isEdited: comments.isEdited,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      userName: users.name,
      userImage: users.image,
      userRole: users.role,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(comments.createdAt));

  const commentIds = rawComments.map((c) => c.id);
  const userLikesSet = new Set<string>();

  if (currentUserId && commentIds.length > 0) {
    const likes = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(and(eq(commentLikes.userId, currentUserId), inArray(commentLikes.commentId, commentIds)));

    likes.forEach((l) => userLikesSet.add(l.commentId));
  }

  return rawComments.map((c) => ({
    id: c.id,
    comicId: c.comicId,
    chapterId: c.chapterId,
    content: c.isDeleted ? "[Comment has been deleted]" : c.content,
    isSpoiler: c.isSpoiler,
    parentId: c.parentId,
    rootId: c.rootId,
    pageNumber: c.pageNumber,
    likeCount: c.likeCount,
    replyCount: c.replyCount,
    isEdited: c.isEdited,
    isDeleted: c.isDeleted,
    createdAt: c.createdAt,
    hasLiked: userLikesSet.has(c.id),
    author: {
      id: c.userId,
      name: c.userName || c.guestName || "Anonymous",
      image: toPublicUrl(c.userImage, "users", storageEnv || {}) ?? c.userImage,
      role: c.userRole || "guest",
    },
  }));
}

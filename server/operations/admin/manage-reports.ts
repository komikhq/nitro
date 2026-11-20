import { commentReports, comments, users, type DbClient } from "@/server/db";
import { eq, desc, sql } from "drizzle-orm";

export async function findReportMany(
  db: DbClient,
  status?: string,
  page = 1,
  limit = 20,
) {
  const offset = (page - 1) * limit;
  const condition = status && status !== "all" ? eq(commentReports.status, status) : undefined;

  const items = await db
    .select({
      id: commentReports.id,
      commentId: commentReports.commentId,
      reason: commentReports.reason,
      details: commentReports.details,
      status: commentReports.status,
      createdAt: commentReports.createdAt,
      reporterName: sql<string>`COALESCE(${users.name}, ${commentReports.reporterGuestName}, 'Guest')`,
      commentContent: comments.content,
      commentIsDeleted: comments.isDeleted,
    })
    .from(commentReports)
    .leftJoin(comments, eq(commentReports.commentId, comments.id))
    .leftJoin(users, eq(commentReports.reporterUserId, users.id))
    .where(condition)
    .orderBy(desc(commentReports.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(commentReports)
    .where(condition);

  return {
    reports: items,
    total: Number(totalCount?.count || 0),
    page,
    limit,
  };
}

export async function updateReportStatus(db: DbClient, reportId: string, status: string) {
  const [report] = await db
    .select()
    .from(commentReports)
    .where(eq(commentReports.id, reportId));

  if (!report) return null;

  if (status === "RESOLVED") {
    // Soft-delete reported comment as intended by moderation resolution
    await db
      .update(comments)
      .set({
        isDeleted: true,
        content: "[Comment removed by moderator]",
        updatedAt: new Date(),
      })
      .where(eq(comments.id, report.commentId));
  }

  const [updated] = await db
    .update(commentReports)
    .set({ status })
    .where(eq(commentReports.id, reportId))
    .returning();

  return updated;
}

import { commentReports, comments, users, type DbClient } from "@/server/db";
import { eq, desc } from "drizzle-orm";

export async function findReportMany(db: DbClient, status: string = "PENDING") {
  return db
    .select({
      id: commentReports.id,
      commentId: commentReports.commentId,
      reason: commentReports.reason,
      details: commentReports.details,
      status: commentReports.status,
      createdAt: commentReports.createdAt,
      reporterName: commentReports.reporterGuestName,
      commentContent: comments.content,
    })
    .from(commentReports)
    .innerJoin(comments, eq(commentReports.commentId, comments.id))
    .where(eq(commentReports.status, status))
    .orderBy(desc(commentReports.createdAt));
}

export async function updateReportStatus(db: DbClient, reportId: string, status: string) {
  const [updated] = await db
    .update(commentReports)
    .set({ status })
    .where(eq(commentReports.id, reportId))
    .returning();
  return updated;
}

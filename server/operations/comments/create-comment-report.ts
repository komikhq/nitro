import { commentReports, type DbClient } from "@/server/db";

export interface CreateCommentReportParams {
  commentId: string;
  reporterUserId?: string;
  reporterGuestName?: string;
  reporterGuestEmail?: string;
  reason: string;
  details?: string;
}

export async function createCommentReport(db: DbClient, params: CreateCommentReportParams) {
  const [report] = await db
    .insert(commentReports)
    .values({
      commentId: params.commentId,
      reporterUserId: params.reporterUserId || null,
      reporterGuestName: params.reporterGuestName || null,
      reporterGuestEmail: params.reporterGuestEmail || null,
      reason: params.reason,
      details: params.details || null,
    })
    .returning();

  return report;
}

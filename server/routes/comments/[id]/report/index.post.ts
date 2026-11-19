import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { createCommentReport } from "@/server/operations/comments";
import { CommentReportSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const commentId = event.context.params?.id;

  if (!commentId) {
    throw new HTTPError({ status: 400, message: "Comment ID is required." });
  }

  const body = await readBody(event);
  const parsed = CommentReportSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for reporting comment." });
  }

  const user = event.context.user;
  const db = useDb(event);

  const report = await createCommentReport(db, {
    commentId,
    reporterUserId: user?.id,
    reporterGuestName: parsed.data.reporterGuestName,
    reporterGuestEmail: parsed.data.reporterGuestEmail,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  return {
    status: "ok",
    data: report,
  };
});

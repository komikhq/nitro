import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { createCommentReport } from "@/server/operations/comments";
import { CommentReportSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    operationId: "reportComment",
    summary: "Report an inappropriate comment",
    description: "Submits a moderation report for a comment with a specific violation reason.",
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comment ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["reason"],
            properties: {
              reason: { type: "string", enum: ["spam", "harassment", "hate_speech", "inappropriate", "spoiler", "other"] },
              details: { type: "string" },
              reporterGuestName: { type: "string" },
              reporterGuestEmail: { type: "string", format: "email" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Report submitted.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      400: {
        description: "Invalid payload.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
});

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

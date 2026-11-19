import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteCommentById } from "@/server/operations/comments";

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    operationId: "deleteComment",
    summary: "Delete comment",
    description: "Deletes a comment. Only the author or an administrator can perform this action.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comment ID" },
    ],
    responses: {
      200: { description: "Comment deleted successfully." },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
    },
  },
});

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const commentId = event.context.params?.id;

  if (!commentId) {
    throw new HTTPError({ status: 400, message: "Comment ID is required." });
  }

  const db = useDb(event);
  const success = await deleteCommentById(db, commentId, user.id, user.role);

  if (!success) {
    throw new HTTPError({
      status: 403,
      message: "Comment not found or you are not authorized to delete it.",
    });
  }

  return {
    status: "ok",
    message: "Comment deleted successfully.",
  };
});

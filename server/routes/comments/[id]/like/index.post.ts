import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { toggleCommentLike } from "@/server/operations/comments";

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    operationId: "toggleCommentLike",
    summary: "Toggle like on comment",
    description: "Adds or removes a like on the specified comment for the authenticated user.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comment ID" },
    ],
    responses: {
      200: { description: "Like status toggled." },
      401: { description: "Unauthorized." },
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
  const result = await toggleCommentLike(db, commentId, user.id);

  return {
    status: "ok",
    data: result,
  };
});

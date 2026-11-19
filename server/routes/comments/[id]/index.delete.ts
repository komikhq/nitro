import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteCommentById } from "@/server/operations/comments";

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

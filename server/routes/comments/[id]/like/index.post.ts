import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { toggleCommentLike } from "@/server/operations/comments";

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

import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { createComment } from "@/server/operations/comments";
import { CommentCreateSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const parsed = CommentCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid comment payload." });
  }

  const user = event.context.user;
  const db = useDb(event);

  const comment = await createComment(db, {
    comicId: parsed.data.comicId,
    chapterId: parsed.data.chapterId,
    userId: user?.id,
    guestName: parsed.data.guestName,
    guestEmail: parsed.data.guestEmail,
    content: parsed.data.content,
    isSpoiler: parsed.data.isSpoiler,
    parentId: parsed.data.parentId,
    pageNumber: parsed.data.pageNumber,
    mentionedUserIds: parsed.data.mentionedUserIds,
  });

  return {
    status: "ok",
    data: comment,
  };
});

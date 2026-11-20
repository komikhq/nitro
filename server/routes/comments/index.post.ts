import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { createComment } from "@/server/operations/comments";
import { CommentCreateSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    operationId: "createComment",
    summary: "Post a comment or reply",
    description: "Posts a new comment or nested reply for a comic or specific chapter.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "content"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              chapterId: { type: "string", format: "uuid" },
              content: { type: "string", minLength: 1 },
              isSpoiler: { type: "boolean", default: false },
              parentId: { type: "string", format: "uuid" },
              guestName: { type: "string" },
              guestEmail: { type: "string", format: "email" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Comment created successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Comment" },
              },
            },
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

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findCommentMany } from "@/server/operations/comments";

defineRouteMeta({
  openAPI: {
    tags: ["Comments"],
    operationId: "listComments",
    summary: "List comments for comic or chapter",
    description: "Returns nested threaded comments with like states and author information.",
    parameters: [
      { name: "comicId", in: "query", required: true, schema: { type: "string", format: "uuid" }, description: "Comic ID" },
      { name: "chapterId", in: "query", schema: { type: "string", format: "uuid" }, description: "Optional chapter ID filter" },
    ],
    responses: {
      200: {
        description: "Comments thread list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Comment" },
                },
              },
            },
          },
        },
      },
      400: {
        description: "comicId is missing.",
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
  const query = getQuery(event);
  const comicId = query.comicId as string | undefined;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "comicId query parameter is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);
  const currentUserId = event.context.user?.id;

  const comments = await findCommentMany(
    db,
    {
      comicId,
      chapterId: query.chapterId as string | undefined,
      currentUserId,
    },
    env,
  );

  return {
    status: "ok",
    data: comments,
    comments,
  };
});

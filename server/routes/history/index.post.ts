import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertHistoryProgress } from "@/server/operations/history";
import { HistoryUpsertSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Reading History"],
    operationId: "recordReadingHistory",
    summary: "Record chapter reading progress",
    description: "Saves or updates reading progress, last read page, and completion status for a comic chapter.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "chapterId"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              chapterId: { type: "string", format: "uuid" },
              lastReadPage: { type: "integer", default: 1 },
              snapshotTotalPages: { type: "integer" },
              isCompleted: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Reading progress recorded successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/ReadingHistory" },
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
      401: { description: "Unauthorized." },
    },
  },
});

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const body = await readBody(event);
  const parsed = HistoryUpsertSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for reading history." });
  }

  const db = useDb(event);
  const history = await upsertHistoryProgress(db, {
    userId: user.id,
    comicId: parsed.data.comicId,
    chapterId: parsed.data.chapterId,
    lastReadPage: parsed.data.lastReadPage,
    snapshotTotalPages: parsed.data.snapshotTotalPages,
    isCompleted: parsed.data.isCompleted,
  });

  return {
    status: "ok",
    data: history,
  };
});

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertBookmark } from "@/server/operations/bookmarks";
import { BookmarkUpsertSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Bookmarks"],
    operationId: "upsertBookmark",
    summary: "Add or update comic bookmark",
    description: "Saves a comic to user bookmarks with a reading status (reading, completed, plan_to_read, dropped).",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "status"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              status: { type: "string", enum: ["reading", "completed", "plan_to_read", "on_hold", "dropped"] },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Bookmark saved successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Bookmark" },
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
  const parsed = BookmarkUpsertSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for bookmark." });
  }

  const db = useDb(event);
  const bookmark = await upsertBookmark(db, user.id, parsed.data.comicId, parsed.data.status);

  return {
    status: "ok",
    data: bookmark,
  };
});

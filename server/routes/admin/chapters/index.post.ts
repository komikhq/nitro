import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createChapter, type CreateChapterParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateChapter",
    summary: "Create comic chapter",
    description: "Inserts a new comic chapter into the database. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "chapterNumber", "slug"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              chapterNumber: { type: "string" },
              title: { type: "string" },
              slug: { type: "string" },
              accessTier: { type: "string", default: "free" },
              isEarlyAccess: { type: "boolean", default: false },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Chapter created successfully." },
      400: { description: "Invalid input." },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as CreateChapterParams | null;

  if (!body || !body.comicId || !body.chapterNumber || !body.slug) {
    throw new HTTPError({ status: 400, message: "comicId, chapterNumber, and slug are required." });
  }

  const db = useDb(event);
  const chapter = await createChapter(db, body);

  return {
    status: "ok",
    data: chapter,
  };
});

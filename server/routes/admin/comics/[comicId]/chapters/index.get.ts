import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { chapters } from "@/server/db";
import { eq, asc } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminListChapters",
    summary: "List chapters for a comic",
    description:
      "Returns all chapters for a given comic, ordered by chapter number. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "comicId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
        description: "Comic ID",
      },
    ],
    responses: {
      200: {
        description: "Chapters listed successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Chapter" },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid input.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const comicId = event.context.params?.comicId;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const chapterList = await db
    .select()
    .from(chapters)
    .where(eq(chapters.comicId, comicId))
    .orderBy(asc(chapters.chapterNumber));

  return {
    status: "ok",
    success: true,
    data: chapterList,
    chapters: chapterList,
  };
});

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { chapters, comics } from "@/server/db";
import { eq, asc, or } from "drizzle-orm";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const isUuid = UUID_REGEX.test(comicId);
  const comicCondition = isUuid
    ? or(eq(comics.id, comicId), eq(comics.slug, comicId))
    : eq(comics.slug, comicId);

  const [comic] = await db
    .select({ id: comics.id })
    .from(comics)
    .where(comicCondition);

  const resolvedComicId = comic ? comic.id : (isUuid ? comicId : null);
  if (!resolvedComicId) {
    return {
      status: "ok",
      success: true,
      data: [],
      chapters: [],
    };
  }

  const chapterList = await db
    .select()
    .from(chapters)
    .where(eq(chapters.comicId, resolvedComicId))
    .orderBy(asc(chapters.chapterNumber));

  return {
    status: "ok",
    success: true,
    data: chapterList,
    chapters: chapterList,
  };
});

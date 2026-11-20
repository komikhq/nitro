import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { finalizeChapter } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminFinalizeChapter",
    summary: "Finalize a chapter",
    description:
      "Updates the chapter total pages count and refreshes the parent comic total chapters. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Chapter ID",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["totalPages"],
            properties: {
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Chapter finalized successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Chapter" },
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
      404: { description: "Chapter not found." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const chapterId = event.context.params?.id;

  if (!chapterId) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const body = (await readBody(event)) as { totalPages?: number } | null;

  if (!body || typeof body.totalPages !== "number") {
    throw new HTTPError({ status: 400, message: "totalPages is required and must be a number." });
  }

  const db = useDb(event);
  const chapter = await finalizeChapter(db, chapterId, body.totalPages);

  if (!chapter) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  return {
    status: "ok",
    data: chapter,
  };
});

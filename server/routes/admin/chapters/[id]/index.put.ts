import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateChapterById, type UpdateChapterParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUpdateChapter",
    summary: "Update a chapter",
    description: "Updates chapter details. Requires administrator privileges.",
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
            properties: {
              chapterNumber: { type: "string" },
              title: { type: "string" },
              accessTier: { type: "string" },
              isEarlyAccess: { type: "boolean" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Chapter updated successfully.",
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
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const body = (await readBody(event)) as UpdateChapterParams | null;

  if (!body) {
    throw new HTTPError({ status: 400, message: "Request body is required." });
  }

  const db = useDb(event);
  const chapter = await updateChapterById(db, id, body);

  if (!chapter) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  return {
    status: "ok",
    data: chapter,
  };
});

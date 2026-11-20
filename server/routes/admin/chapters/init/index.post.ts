import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { initializeChapter, type InitializeChapterParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminInitializeChapter",
    summary: "Initialize a new chapter",
    description:
      "Creates a new chapter with an auto-generated slug. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "chapterNumber"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              chapterNumber: { type: "string" },
              title: { type: "string" },
              accessTier: { type: "string", default: "free" },
              isEarlyAccess: { type: "boolean", default: false },
              totalPages: { type: "integer" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Chapter initialized successfully.",
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
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as InitializeChapterParams | null;

  if (!body || !body.comicId || !body.chapterNumber) {
    throw new HTTPError({
      status: 400,
      message: "comicId and chapterNumber are required.",
    });
  }

  const db = useDb(event);
  const chapter = await initializeChapter(db, body);

  return {
    status: "ok",
    success: true,
    data: chapter,
    chapter,
  };
});

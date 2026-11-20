import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createChapterPages } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateChapterPages",
    summary: "Set chapter pages",
    description: "Replaces and reorders all pages for a chapter. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Chapter ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["pages"],
            properties: {
              pages: {
                type: "array",
                items: {
                  type: "object",
                  required: ["pageNumber", "imageUrl"],
                  properties: {
                    pageNumber: { type: "integer" },
                    imageUrl: { type: "string" },
                    width: { type: "integer" },
                    height: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Chapter pages updated successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    pagesCount: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid pages array.",
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
  const chapterId = event.context.params?.id;

  if (!chapterId) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const body = (await readBody(event)) as {
    pages?: { pageNumber: number; imageUrl: string; width?: number; height?: number }[];
  } | null;

  if (!Array.isArray(body?.pages)) {
    throw new HTTPError({ status: 400, message: "Pages array is required." });
  }

  const db = useDb(event);
  const result = await createChapterPages(db, chapterId, body.pages);

  return {
    status: "ok",
    data: result,
  };
});

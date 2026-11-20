import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createComic, type CreateComicParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateComic",
    summary: "Create a new comic",
    description: "Inserts a new comic record into the catalog. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["title", "slug", "coverUrl"],
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string" },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"], default: "manhwa" },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"], default: "ongoing" },
              accessTier: { type: "string", default: "free" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Comic created successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Comic" },
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
  const body = (await readBody(event)) as CreateComicParams;

  if (!body?.title || !body?.slug || !body?.coverUrl) {
    throw new HTTPError({ status: 400, message: "Title, slug, and coverUrl are required." });
  }

  const db = useDb(event);
  const comic = await createComic(db, body);

  return {
    status: "ok",
    data: comic,
  };
});

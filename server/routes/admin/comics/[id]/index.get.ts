import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findComicBySlug } from "@/server/operations/comics";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminGetComic",
    summary: "Get comic details (Admin)",
    description: "Gets comic details by ID or slug with full genres, creators, and chapter list. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    responses: {
      200: {
        description: "The comic and its details.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/ComicDetail" },
              },
            },
          },
        },
      },
      404: { description: "Comic not found." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const comicData = await findComicBySlug(db, id, env);

  if (!comicData) {
    throw new HTTPError({ status: 404, message: "Comic not found." });
  }

  return {
    status: "ok",
    success: true,
    data: comicData,
    ...comicData,
  };
});

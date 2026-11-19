import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateComicById, type UpdateComicParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUpdateComic",
    summary: "Update comic by ID",
    description: "Updates comic metadata by ID. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string" },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"] },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"] },
              accessTier: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Comic updated successfully." },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
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

  const body = (await readBody(event)) as UpdateComicParams;
  const db = useDb(event);
  const comic = await updateComicById(db, id, body);

  if (!comic) {
    throw new HTTPError({ status: 404, message: "Comic not found." });
  }

  return {
    status: "ok",
    data: comic,
  };
});

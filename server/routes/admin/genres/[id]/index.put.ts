import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateGenreById } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUpdateGenre",
    summary: "Update genre by ID",
    description: "Modifies genre name, slug, or description. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Genre ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Genre updated successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Genre" },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
      404: {
        description: "Genre not found.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Genre ID is required." });
  }

  const body = (await readBody(event)) as {
    name?: string;
    slug?: string;
    description?: string;
  } | null;

  if (!body) {
    throw new HTTPError({ status: 400, message: "Request body is required." });
  }

  const db = useDb(event);
  const updated = await updateGenreById(db, id, body);

  if (!updated) {
    throw new HTTPError({ status: 404, message: "Genre not found." });
  }

  return {
    status: "ok",
    data: updated,
  };
});

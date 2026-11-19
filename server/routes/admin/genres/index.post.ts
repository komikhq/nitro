import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createGenre } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateGenre",
    summary: "Create a new genre",
    description: "Inserts a new comic genre into the database. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "slug"],
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
      200: { description: "Genre created successfully." },
      400: { description: "Invalid input." },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as {
    name?: string;
    slug?: string;
    description?: string;
  } | null;

  if (!body || !body.name || !body.slug) {
    throw new HTTPError({ status: 400, message: "Name and slug are required." });
  }

  const db = useDb(event);
  const genre = await createGenre(db, body.name, body.slug, body.description);

  return {
    status: "ok",
    data: genre,
  };
});

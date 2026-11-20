import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { findGenreMany } from "@/server/operations/genres";

defineRouteMeta({
  openAPI: {
    tags: ["Genres"],
    operationId: "listGenres",
    summary: "List all comic genres",
    description: "Returns the full catalog of available comic genres.",
    responses: {
      200: {
        description: "Genre catalog list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Genre" },
                },
              },
            },
          },
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  const db = useDb(event);
  const genres = await findGenreMany(db);

  return {
    status: "ok",
    data: genres,
  };
});

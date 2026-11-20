import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { genres } from "@/server/db";
import { asc } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminListGenres",
    summary: "List all genres (Admin)",
    description: "Returns all genres. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "The genre catalog.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                genres: { type: "array", items: { $ref: "#/components/schemas/Genre" } },
              },
            },
          },
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const db = useDb(event);

  const list = await db.select().from(genres).orderBy(asc(genres.name));

  return {
    status: "ok",
    success: true,
    data: list,
    genres: list,
  };
});

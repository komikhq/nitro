import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findComicMany } from "@/server/operations/comics";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminListComics",
    summary: "List comics (Admin)",
    description: "Lists comics with search, status filtering, and pagination. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "q", in: "query", schema: { type: "string" }, description: "Search query string" },
      { name: "status", in: "query", schema: { type: "string" }, description: "Filter by status" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 15 } },
    ],
    responses: {
      200: {
        description: "Matching comics and pagination metadata.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    items: { type: "array", items: { $ref: "#/components/schemas/Comic" } },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
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
  requireAdmin(event);
  const query = getQuery(event);
  const q = typeof query.q === "string" ? query.q.trim() : undefined;
  const status = typeof query.status === "string" && query.status !== "all" ? query.status : undefined;
  const page = parseInt(String(query.page || "1"), 10) || 1;
  const limit = parseInt(String(query.limit || "15"), 10) || 15;

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const data = await findComicMany(
    db,
    {
      q,
      status,
      page,
      limit,
    },
    env,
  );

  return {
    status: "ok",
    success: true,
    data: {
      items: data.comics,
      comics: data.comics,
      pagination: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      },
    },
    comics: data.comics,
    pagination: {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    },
  };
});

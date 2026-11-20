import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicMany } from "@/server/operations/comics";
import { ComicFilterSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Comics"],
    operationId: "listComics",
    summary: "List and filter comics",
    description: "Returns a paginated list of comics with optional filters for genre, type, status, and sort.",
    parameters: [
      { name: "q", in: "query", schema: { type: "string" }, description: "Search query string" },
      { name: "genre", in: "query", schema: { type: "string" }, description: "Filter by genre slug" },
      { name: "status", in: "query", schema: { type: "string", enum: ["ongoing", "completed", "hiatus"] } },
      { name: "type", in: "query", schema: { type: "string", enum: ["manga", "manhwa", "manhua"] } },
      { name: "sort", in: "query", schema: { type: "string", enum: ["latest", "popular", "updated"] } },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
    ],
    responses: {
      200: {
        description: "Paginated comic list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Comic" },
                    },
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
  const query = getQuery(event);
  const parsed = ComicFilterSchema.safeParse(query);

  const filters = parsed.success
    ? parsed.data
    : { page: 1, limit: 20, sort: "latest" as const, order: "desc" as const };

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const data = await findComicMany(
    db,
    {
      q: query.q as string | undefined,
      genre: filters.genre,
      status: filters.status,
      type: filters.type,
      sort: filters.sort,
      page: filters.page,
      limit: filters.limit,
    },
    env,
  );

  return {
    status: "ok",
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
    pagination: {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    },
  };
});

import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicTrending } from "@/server/operations/comics";

defineRouteMeta({
  openAPI: {
    tags: ["Comics"],
    operationId: "getTrendingComics",
    summary: "Get trending comics",
    description: "Returns a list of trending and popular comics ranked by views.",
    parameters: [
      { name: "limit", in: "query", schema: { type: "integer", default: 10 }, description: "Max comics to return (max 50)" },
    ],
    responses: {
      200: {
        description: "Trending comics list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Comic" },
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
  const limit = Math.min(Number(query.limit) || 10, 50);

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const data = await findComicTrending(db, limit, env);

  return {
    status: "ok",
    data: data.comics,
  };
});

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
  const periodParam = (query.period as string) || "daily";
  const period = (["daily", "weekly", "popular"].includes(periodParam) ? periodParam : "daily") as "daily" | "weekly" | "popular";

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const data = await findComicTrending(db, limit, env, period, (env as any)?.KV_VIEWS);

  return {
    status: "ok",
    period,
    total: data.comics?.length || 0,
    data: data.comics,
    comics: data.comics,
  };
});

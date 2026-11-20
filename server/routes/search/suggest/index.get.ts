import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findSearchSuggestions } from "@/server/operations/search";

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    operationId: "getSearchSuggestions",
    summary: "Instant search autocomplete suggestions",
    description: "Returns scored autocomplete search suggestions using CTE matching with KV caching.",
    parameters: [
      { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Partial query string" },
      { name: "limit", in: "query", schema: { type: "integer", default: 8 }, description: "Max suggestions" },
    ],
    responses: {
      200: {
        description: "Search suggestions list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      slug: { type: "string" },
                      type: { type: "string" },
                      coverUrl: { type: "string" },
                    },
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
  const q = String(query.q || "").trim();
  const limit = Math.min(Number(query.limit) || 8, 20);

  if (!q) {
    return {
      status: "ok",
      data: [],
    };
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const suggestions = await findSearchSuggestions(db, q, limit, env);

  return {
    status: "ok",
    data: suggestions,
    suggestions,
    query: q,
  };
});

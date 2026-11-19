import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicMany } from "@/server/operations/comics";

defineRouteMeta({
  openAPI: {
    tags: ["Search"],
    operationId: "searchComics",
    summary: "Full text comic search",
    description: "Searches comics across titles, alternate titles, and slugs with pagination.",
    parameters: [
      { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
      { name: "page", in: "query", schema: { type: "integer", default: 1 } },
      { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
    ],
    responses: {
      200: { description: "Search results list." },
    },
  },
});

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const q = String(query.q || "").trim();
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 20, 50);

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const data = await findComicMany(
    db,
    {
      q: q || undefined,
      page,
      limit,
    },
    env,
  );

  return {
    status: "ok",
    data: data.comics,
    pagination: {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    },
  };
});

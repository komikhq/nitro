import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { ComicSearchService } from "@/server/services/comic-search.service";

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
  const service = new ComicSearchService(db, env);

  const suggestions = await service.getSuggestions(q, limit);

  return {
    status: "ok",
    data: suggestions,
  };
});

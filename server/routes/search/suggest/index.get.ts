import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findSearchSuggestions } from "@/server/operations/search";

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
  };
});

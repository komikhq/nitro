import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicTrending } from "@/server/operations/comics";

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

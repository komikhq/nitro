import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { ComicService } from "@/server/services/comic.service";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(Number(query.limit) || 10, 50);

  const db = useDb(event);
  const env = useCloudflareEnv(event);
  const service = new ComicService(db, env);

  const data = await service.getTrending(limit);

  return {
    status: "ok",
    data: data.comics,
  };
});

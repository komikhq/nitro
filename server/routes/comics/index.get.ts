import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { ComicService } from "@/server/services/comic.service";
import { ComicFilterSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const parsed = ComicFilterSchema.safeParse(query);

  const filters = parsed.success
    ? parsed.data
    : { page: 1, limit: 20, sort: "latest" as const, order: "desc" as const };

  const db = useDb(event);
  const env = useCloudflareEnv(event);
  const service = new ComicService(db, env);

  const data = await service.listComics({
    q: query.q as string | undefined,
    genre: filters.genre,
    status: filters.status,
    type: filters.type,
    sort: filters.sort,
    page: filters.page,
    limit: filters.limit,
  });

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

import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findUserMany } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const query = getQuery(event);

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const result = await findUserMany(
    db,
    {
      query: (query.q as string) || undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    },
    env,
  );

  return {
    status: "ok",
    data: result,
  };
});

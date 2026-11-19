import { defineHandler } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findHistoryManyByUser } from "@/server/operations/history";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const history = await findHistoryManyByUser(db, user.id, env);

  return {
    status: "ok",
    data: history,
  };
});

import { defineHandler } from "nitro";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findSystemHealth } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const env = useCloudflareEnv(event);
  const health = await findSystemHealth(env);

  return {
    status: "ok",
    data: health,
  };
});

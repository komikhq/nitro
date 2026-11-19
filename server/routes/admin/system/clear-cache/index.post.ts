import { defineHandler, HTTPError } from "nitro";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const env = useCloudflareEnv(event);

  if (!env?.KV_KOMIKHQ) {
    throw new HTTPError({ status: 500, message: "KV_KOMIKHQ binding is not available." });
  }

  let clearedKeys = 0;
  let cursor: string | undefined = undefined;

  try {
    do {
      const listRes: any = await env.KV_KOMIKHQ.list({
        prefix: "comic-search:suggestions:",
        cursor,
      });

      cursor = listRes.cursor;

      if (Array.isArray(listRes.keys)) {
        for (const key of listRes.keys) {
          await env.KV_KOMIKHQ.delete(key.name);
          clearedKeys++;
        }
      }
    } while (cursor);

    return {
      status: "ok",
      message: `Search suggestion cache invalidated successfully (${clearedKeys} cached queries cleared).`,
      data: {
        clearedKeys,
      },
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to clear search cache.",
    });
  }
});

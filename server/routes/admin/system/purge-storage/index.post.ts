import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { purgeStorageOrphans } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  try {
    const result = await purgeStorageOrphans(db, env);
    return {
      status: "ok",
      message: `Cleanup successful! ${result.purgedCount} orphan files (${result.totalSizeMB} MB) deleted from storage.`,
      data: result,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to purge orphan storage files.",
    });
  }
});

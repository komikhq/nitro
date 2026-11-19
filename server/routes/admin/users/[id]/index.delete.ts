import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { deleteUserById } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

export default defineHandler(async (event) => {
  const currentUser = requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "User ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  try {
    const deletedUser = await deleteUserById(db, env, id, currentUser.id);
    return {
      status: "ok",
      message: `User ${deletedUser.name} (${deletedUser.email}) deleted successfully.`,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 400,
      message: err.message || "Failed to delete user.",
    });
  }
});

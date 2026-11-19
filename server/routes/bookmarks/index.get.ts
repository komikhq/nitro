import { defineHandler } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findBookmarkManyByUser } from "@/server/operations/bookmarks";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const bookmarks = await findBookmarkManyByUser(db, user.id, env);

  return {
    status: "ok",
    data: bookmarks,
  };
});

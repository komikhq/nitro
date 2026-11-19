import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findUserProfile } from "@/server/operations/users";

export default defineHandler(async (event) => {
  const sessionUser = requireUser(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const profile = await findUserProfile(db, sessionUser.id, env);
  if (!profile) {
    throw new HTTPError({ status: 404, message: "User not found." });
  }

  return {
    status: "ok",
    data: profile,
  };
});

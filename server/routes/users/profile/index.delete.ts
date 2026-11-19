import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireUser } from "@/server/utils/protect";
import { deleteUserSelf, type DeleteUserSelfParams } from "@/server/operations/users";

export default defineHandler(async (event) => {
  const sessionUser = requireUser(event);
  const db = useDb(event);
  const auth = useAuth(event);

  let body: DeleteUserSelfParams = {};
  try {
    body = ((await readBody(event)) as DeleteUserSelfParams) || {};
  } catch {
    // Body is optional if user registered via social provider without password
  }

  const rawHeaders = new Headers();
  for (const [key, val] of Object.entries(event.headers || {})) {
    if (val) rawHeaders.set(key, Array.isArray(val) ? val.join(", ") : val);
  }

  try {
    await deleteUserSelf(db, auth, sessionUser.id, sessionUser.email, body, rawHeaders);
    return {
      status: "ok",
      message: "Account deleted permanently.",
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 400,
      message: err.message || "Failed to delete account.",
    });
  }
});

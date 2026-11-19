import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireAdmin } from "@/server/utils/protect";
import { updateUserById, type UpdateUserByIdParams } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "User ID is required." });
  }

  const body = (await readBody(event)) as UpdateUserByIdParams | null;
  if (!body) {
    throw new HTTPError({ status: 400, message: "Request body is required." });
  }

  const db = useDb(event);
  const auth = useAuth(event);

  const rawHeaders = new Headers();
  for (const [key, val] of Object.entries(event.headers || {})) {
    if (val) rawHeaders.set(key, Array.isArray(val) ? val.join(", ") : val);
  }

  try {
    const updated = await updateUserById(db, auth, id, body, rawHeaders);
    return {
      status: "ok",
      data: updated,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 400,
      message: err.message || "Failed to update user.",
    });
  }
});

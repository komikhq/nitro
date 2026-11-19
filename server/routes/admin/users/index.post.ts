import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireAdmin } from "@/server/utils/protect";
import { createUser, type CreateUserParams } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as CreateUserParams | null;

  if (!body || !body.name || !body.email || !body.password) {
    throw new HTTPError({ status: 400, message: "Name, email, and password are required." });
  }

  const db = useDb(event);
  const auth = useAuth(event);

  try {
    const user = await createUser(auth, db, body);
    return {
      status: "ok",
      data: user,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 400,
      message: err.message || "Failed to create user.",
    });
  }
});

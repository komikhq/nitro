import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireUser } from "@/server/utils/protect";
import { deleteUserSelf, type DeleteUserSelfParams } from "@/server/operations/users";

defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    operationId: "deleteOwnAccount",
    summary: "Delete own account",
    description: "Permanently deletes the authenticated user's account with confirmation password or matching email.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              password: { type: "string", description: "Required if account has credential password" },
              email: { type: "string", description: "Required if account is OAuth-only" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Account deleted successfully.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      400: {
        description: "Verification failed.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
    },
  },
});

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

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findUserProfile } from "@/server/operations/users";

defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    operationId: "getUserProfile",
    summary: "Get current user profile",
    description: "Returns profile details and credential password status for the authenticated user.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "User profile retrieved successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/UserProfile" },
              },
            },
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

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { deleteUserById } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminDeleteUser",
    summary: "Delete user account (Admin only)",
    description: "Permanently delete a user account and their storage assets.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "User ID",
      },
    ],
    responses: {
      200: {
        description: "User deleted successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      400: { description: "Bad request - cannot delete own account" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      404: { description: "User not found" },
    },
  },
});

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

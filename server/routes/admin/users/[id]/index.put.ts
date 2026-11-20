import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireAdmin } from "@/server/utils/protect";
import { updateUserById, type UpdateUserByIdParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUpdateUser",
    summary: "Update user account (Admin only)",
    description: "Update details, role, or reset password for an existing user account.",
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
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["user", "admin"] },
              password: { type: "string", minLength: 8 },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "User account updated successfully",
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
      400: { description: "Invalid input" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      404: { description: "User not found" },
    },
  },
});

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
      success: true,
      data: updated,
      user: updated,
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 400,
      message: err.message || "Failed to update user.",
    });
  }
});

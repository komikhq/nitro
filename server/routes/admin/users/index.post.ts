import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useAuth } from "@/server/utils/auth";
import { requireAdmin } from "@/server/utils/protect";
import { createUser, type CreateUserParams } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateUser",
    summary: "Create new user account (Admin only)",
    description: "Provision a new user account with custom credentials and role.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "email", "password"],
            properties: {
              name: { type: "string", example: "John Doe" },
              email: { type: "string", format: "email", example: "user@example.com" },
              password: { type: "string", format: "password", minLength: 8 },
              role: { type: "string", enum: ["user", "admin"], default: "user" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "User created successfully",
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
      400: { description: "Invalid input or user already exists" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
    },
  },
});

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

import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { findUserMany } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminListUsers",
    summary: "List registered users (Admin only)",
    description: "Paginated user list with optional search query.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "q",
        in: "query",
        required: false,
        schema: { type: "string" },
        description: "Search keyword for name or email",
      },
      {
        name: "page",
        in: "query",
        required: false,
        schema: { type: "integer", default: 1 },
        description: "Page number",
      },
      {
        name: "limit",
        in: "query",
        required: false,
        schema: { type: "integer", default: 20 },
        description: "Items per page",
      },
    ],
    responses: {
      200: {
        description: "Paginated list of users",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UserProfile" },
                    },
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/UserProfile" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const query = getQuery(event);

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const result = await findUserMany(
    db,
    {
      query: (query.q as string) || undefined,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    },
    env,
  );

  return {
    status: "ok",
    data: {
      items: result.users,
      users: result.users,
      pagination: result.pagination,
    },
    items: result.users,
    users: result.users,
    pagination: result.pagination,
  };
});

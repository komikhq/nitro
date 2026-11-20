import { defineHandler, defineRouteMeta } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { findReportMany } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Moderation"],
    operationId: "adminListReports",
    summary: "List user reports (Admin only)",
    description: "Fetch reported comments and issues filtered by status.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "status",
        in: "query",
        required: false,
        schema: { type: "string", enum: ["PENDING", "RESOLVED", "REJECTED"], default: "PENDING" },
        description: "Report review status",
      },
    ],
    responses: {
      200: {
        description: "List of reports",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      commentId: { type: "string" },
                      userId: { type: "string" },
                      reason: { type: "string" },
                      status: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                    },
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
  const status = (query.status as string) || undefined;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;

  const db = useDb(event);
  const result = await findReportMany(db, status, page, limit);

  return {
    status: "ok",
    success: true,
    data: result,
    reports: result.reports,
    total: result.total,
    page: result.page,
    limit: result.limit,
  };
});

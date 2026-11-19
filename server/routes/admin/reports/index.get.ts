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
  const status = (query.status as string) || "PENDING";

  const db = useDb(event);
  const reports = await findReportMany(db, status);

  return {
    status: "ok",
    data: reports,
  };
});

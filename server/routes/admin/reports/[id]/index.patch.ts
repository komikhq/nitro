import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateReportStatus } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Moderation"],
    operationId: "adminUpdateReport",
    summary: "Update report status (Admin only)",
    description: "Update resolution status of a reported item.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Report ID",
      },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string", enum: ["PENDING", "RESOLVED", "REJECTED"], example: "RESOLVED" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Report status updated successfully",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: { description: "Bad request - invalid status" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      404: { description: "Report not found" },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Report ID is required." });
  }

  const body = (await readBody(event)) as { status?: string } | null;
  if (!body || !body.status) {
    throw new HTTPError({ status: 400, message: "Status is required." });
  }

  const db = useDb(event);
  const report = await updateReportStatus(db, id, body.status);

  if (!report) {
    throw new HTTPError({ status: 404, message: "Report not found." });
  }

  return {
    status: "ok",
    success: true,
    data: report,
    report,
  };
});

import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateReportStatus } from "@/server/operations/admin";

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
    data: report,
  };
});

import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { findReportMany } from "@/server/operations/admin";

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

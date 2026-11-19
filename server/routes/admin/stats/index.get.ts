import { defineHandler } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { findSystemStats } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const db = useDb(event);

  const stats = await findSystemStats(db);

  return {
    status: "ok",
    data: stats,
  };
});

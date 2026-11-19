import { defineHandler, HTTPError } from "nitro";
import { runTask } from "nitro/task";
import { requireAdmin } from "@/server/utils/protect";

export default defineHandler(async (event) => {
  requireAdmin(event);

  try {
    const viewsResult = await runTask("views:sync-delta");
    const rankingsResult = await runTask("rankings:refresh");

    return {
      status: "ok",
      message: "View counts and rankings synchronized successfully.",
      data: {
        viewsResult,
        rankingsResult,
      },
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to synchronize views.",
    });
  }
});

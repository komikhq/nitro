import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findHistoryManyByUser } from "@/server/operations/history";

defineRouteMeta({
  openAPI: {
    tags: ["Reading History"],
    operationId: "listReadingHistory",
    summary: "List user reading history",
    description: "Returns reading history entries and chapter progress for the authenticated user.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: { description: "Reading history list." },
      401: { description: "Unauthorized." },
    },
  },
});

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const history = await findHistoryManyByUser(db, user.id, env);

  return {
    status: "ok",
    data: history,
  };
});

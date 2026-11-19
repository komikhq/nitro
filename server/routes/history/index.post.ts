import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertHistoryProgress } from "@/server/operations/history";
import { HistoryUpsertSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const body = await readBody(event);
  const parsed = HistoryUpsertSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for reading history." });
  }

  const db = useDb(event);
  const history = await upsertHistoryProgress(db, {
    userId: user.id,
    comicId: parsed.data.comicId,
    chapterId: parsed.data.chapterId,
    lastReadPage: parsed.data.lastReadPage,
    snapshotTotalPages: parsed.data.snapshotTotalPages,
    isCompleted: parsed.data.isCompleted,
  });

  return {
    status: "ok",
    data: history,
  };
});

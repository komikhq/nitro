import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertBookmark } from "@/server/operations/bookmarks";
import { BookmarkUpsertSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const body = await readBody(event);
  const parsed = BookmarkUpsertSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for bookmark." });
  }

  const db = useDb(event);
  const bookmark = await upsertBookmark(db, user.id, parsed.data.comicId, parsed.data.status);

  return {
    status: "ok",
    data: bookmark,
  };
});

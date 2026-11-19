import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createChapter, type CreateChapterParams } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as CreateChapterParams | null;

  if (!body || !body.comicId || !body.chapterNumber || !body.slug) {
    throw new HTTPError({ status: 400, message: "comicId, chapterNumber, and slug are required." });
  }

  const db = useDb(event);
  const chapter = await createChapter(db, body);

  return {
    status: "ok",
    data: chapter,
  };
});

import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createChapterPages } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const chapterId = event.context.params?.id;

  if (!chapterId) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const body = (await readBody(event)) as {
    pages?: { pageNumber: number; imageUrl: string; width?: number; height?: number }[];
  } | null;

  if (!Array.isArray(body?.pages)) {
    throw new HTTPError({ status: 400, message: "Pages array is required." });
  }

  const db = useDb(event);
  const result = await createChapterPages(db, chapterId, body.pages);

  return {
    status: "ok",
    data: result,
  };
});

import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { ChapterService } from "@/server/services/chapter.service";

export default defineHandler(async (event) => {
  const comicSlug = event.context.params?.comicSlug;
  const chapterSlug = event.context.params?.chapterSlug;

  if (!comicSlug || !chapterSlug) {
    throw new HTTPError({ status: 400, message: "Comic slug and chapter slug are required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);
  const service = new ChapterService(db, env);

  const chapterData = await service.getChapterPages(comicSlug, chapterSlug);

  if (!chapterData) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  return {
    status: "ok",
    data: chapterData,
  };
});

import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createComic, type CreateComicParams } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as CreateComicParams;

  if (!body?.title || !body?.slug || !body?.coverUrl) {
    throw new HTTPError({ status: 400, message: "Title, slug, and coverUrl are required." });
  }

  const db = useDb(event);
  const comic = await createComic(db, body);

  return {
    status: "ok",
    data: comic,
  };
});

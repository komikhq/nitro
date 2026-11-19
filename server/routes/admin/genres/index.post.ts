import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { createGenre } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const body = (await readBody(event)) as {
    name?: string;
    slug?: string;
    description?: string;
  } | null;

  if (!body || !body.name || !body.slug) {
    throw new HTTPError({ status: 400, message: "Name and slug are required." });
  }

  const db = useDb(event);
  const genre = await createGenre(db, body.name, body.slug, body.description);

  return {
    status: "ok",
    data: genre,
  };
});

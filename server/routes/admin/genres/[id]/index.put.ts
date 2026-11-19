import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { updateGenreById } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Genre ID is required." });
  }

  const body = (await readBody(event)) as {
    name?: string;
    slug?: string;
    description?: string;
  } | null;

  if (!body) {
    throw new HTTPError({ status: 400, message: "Request body is required." });
  }

  const db = useDb(event);
  const updated = await updateGenreById(db, id, body);

  if (!updated) {
    throw new HTTPError({ status: 404, message: "Genre not found." });
  }

  return {
    status: "ok",
    data: updated,
  };
});

import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { deleteGenreById } from "@/server/operations/admin";

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Genre ID is required." });
  }

  const db = useDb(event);
  const success = await deleteGenreById(db, id);

  if (!success) {
    throw new HTTPError({ status: 404, message: "Genre not found." });
  }

  return {
    status: "ok",
    message: "Genre deleted successfully.",
  };
});

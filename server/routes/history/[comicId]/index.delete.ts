import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteHistoryByComic } from "@/server/operations/history";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const comicId = event.context.params?.comicId;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const success = await deleteHistoryByComic(db, user.id, comicId);

  if (!success) {
    throw new HTTPError({ status: 404, message: "Reading history not found." });
  }

  return {
    status: "ok",
    message: "Reading history deleted successfully.",
  };
});

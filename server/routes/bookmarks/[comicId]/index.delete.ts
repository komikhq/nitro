import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteBookmarkByComic } from "@/server/operations/bookmarks";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const comicId = event.context.params?.comicId;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const success = await deleteBookmarkByComic(db, user.id, comicId);

  if (!success) {
    throw new HTTPError({ status: 404, message: "Bookmark not found." });
  }

  return {
    status: "ok",
    message: "Bookmark deleted successfully.",
  };
});

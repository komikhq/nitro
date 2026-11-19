import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteBookmarkByComic } from "@/server/operations/bookmarks";

defineRouteMeta({
  openAPI: {
    tags: ["Bookmarks"],
    operationId: "deleteBookmark",
    summary: "Remove comic bookmark",
    description: "Deletes a comic from the user's bookmarks list.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "comicId", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    responses: {
      200: { description: "Bookmark removed successfully." },
      401: { description: "Unauthorized." },
      404: { description: "Bookmark not found." },
    },
  },
});

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

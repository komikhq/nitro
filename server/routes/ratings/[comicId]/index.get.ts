import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { findRatingByComic } from "@/server/operations/ratings";

export default defineHandler(async (event) => {
  const comicId = event.context.params?.comicId;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const userId = event.context.user?.id;

  const data = await findRatingByComic(db, comicId, userId);

  return {
    status: "ok",
    data,
  };
});

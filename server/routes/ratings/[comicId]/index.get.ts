import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { findRatingByComic } from "@/server/operations/ratings";

defineRouteMeta({
  openAPI: {
    tags: ["Ratings"],
    operationId: "getComicRating",
    summary: "Get comic rating stats and user rating",
    description: "Returns average rating score, total rating count, and user's own score if authenticated.",
    parameters: [
      { name: "comicId", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    responses: {
      200: { description: "Comic rating data." },
    },
  },
});

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

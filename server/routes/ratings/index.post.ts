import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertRating } from "@/server/operations/ratings";
import { RatingUpsertSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const body = await readBody(event);
  const parsed = RatingUpsertSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for rating." });
  }

  const db = useDb(event);
  const rating = await upsertRating(
    db,
    user.id,
    parsed.data.comicId,
    parsed.data.score,
    parsed.data.reviewText,
  );

  return {
    status: "ok",
    data: rating,
  };
});

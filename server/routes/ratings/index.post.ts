import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { upsertRating } from "@/server/operations/ratings";
import { RatingUpsertSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Ratings"],
    operationId: "upsertComicRating",
    summary: "Rate a comic",
    description: "Submits a rating score (1-10) and optional review text for a comic.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId", "score"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              score: { type: "integer", minimum: 1, maximum: 10 },
              reviewText: { type: "string" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Rating submitted successfully." },
      400: { description: "Invalid payload." },
      401: { description: "Unauthorized." },
    },
  },
});

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

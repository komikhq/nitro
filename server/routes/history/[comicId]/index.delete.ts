import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireUser } from "@/server/utils/protect";
import { deleteHistoryByComic } from "@/server/operations/history";

defineRouteMeta({
  openAPI: {
    tags: ["Reading History"],
    operationId: "deleteReadingHistory",
    summary: "Clear reading history for comic",
    description: "Removes reading history records for a specific comic.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "comicId", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    responses: {
      200: {
        description: "Reading history deleted successfully.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      404: {
        description: "Not found.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
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
  const success = await deleteHistoryByComic(db, user.id, comicId);

  if (!success) {
    throw new HTTPError({ status: 404, message: "Reading history not found." });
  }

  return {
    status: "ok",
    message: "Reading history deleted successfully.",
  };
});

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { requireAdmin } from "@/server/utils/protect";
import { deleteGenreById } from "@/server/operations/admin";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminDeleteGenre",
    summary: "Delete genre (Admin only)",
    description: "Permanently delete an existing comic genre.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Genre ID to delete",
      },
    ],
    responses: {
      200: {
        description: "Genre deleted successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden - Admin access required" },
      404: { description: "Genre not found" },
    },
  },
});

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

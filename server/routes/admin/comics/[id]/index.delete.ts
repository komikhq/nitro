import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { deleteComicById } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminDeleteComic",
    summary: "Delete comic by ID",
    description: "Permanently deletes a comic record, cascade deletes chapters/pages, and purges storage assets. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    responses: {
      200: {
        description: "Comic deleted successfully.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
      404: {
        description: "Comic not found.",
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
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;
  const deletedComic = await deleteComicById(db, id, env);

  if (!deletedComic) {
    throw new HTTPError({ status: 404, message: "Comic not found." });
  }

  return {
    status: "ok",
    success: true,
    message: `Comic "${deletedComic.title}" deleted successfully.`,
  };
});

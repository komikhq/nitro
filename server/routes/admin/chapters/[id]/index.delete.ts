import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { deleteChapterById } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminDeleteChapter",
    summary: "Delete chapter by ID",
    description: "Permanently deletes a chapter record and its pages from the database. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Chapter ID" },
    ],
    responses: {
      200: {
        description: "Chapter deleted successfully.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
      404: {
        description: "Chapter not found.",
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
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;
  const deletedChapter = await deleteChapterById(db, id, env);

  if (!deletedChapter) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  return {
    status: "ok",
    success: true,
    message: `Chapter ${deletedChapter.chapterNumber} deleted successfully.`,
    chapter: deletedChapter,
  };
});

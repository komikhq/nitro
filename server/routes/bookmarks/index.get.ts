import { defineHandler, defineRouteMeta } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { findBookmarkManyByUser } from "@/server/operations/bookmarks";

defineRouteMeta({
  openAPI: {
    tags: ["Bookmarks"],
    operationId: "listBookmarks",
    summary: "List user bookmarks",
    description: "Returns all saved comic bookmarks for the authenticated user.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "User bookmarks list.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Bookmark" },
                },
              },
            },
          },
        },
      },
      401: { description: "Unauthorized." },
    },
  },
});

export default defineHandler(async (event) => {
  const user = requireUser(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const bookmarks = await findBookmarkManyByUser(db, user.id, env);

  return {
    status: "ok",
    success: true,
    data: bookmarks,
    bookmarks,
  };
});

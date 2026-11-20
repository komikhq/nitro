import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findChapterReaderPages } from "@/server/operations/chapters";

defineRouteMeta({
  openAPI: {
    tags: ["Chapters"],
    operationId: "getChapterReaderPages",
    summary: "Get chapter reader pages and navigation",
    description: "Returns chapter pages with CDN image URLs and previous/next chapter navigation.",
    parameters: [
      { name: "comicSlug", in: "path", required: true, schema: { type: "string" }, description: "Comic slug" },
      { name: "chapterSlug", in: "path", required: true, schema: { type: "string" }, description: "Chapter slug" },
    ],
    responses: {
      200: {
        description: "Chapter reader pages retrieved successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    chapter: { $ref: "#/components/schemas/Chapter" },
                    pages: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ChapterPage" },
                    },
                    prevChapter: {
                      type: "object",
                      nullable: true,
                      properties: {
                        slug: { type: "string" },
                        chapterNumber: { type: "string" },
                      },
                    },
                    nextChapter: {
                      type: "object",
                      nullable: true,
                      properties: {
                        slug: { type: "string" },
                        chapterNumber: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      404: {
        description: "Chapter or comic not found.",
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
  const comicSlug = event.context.params?.comicSlug;
  const chapterSlug = event.context.params?.chapterSlug;

  if (!comicSlug || !chapterSlug) {
    throw new HTTPError({ status: 400, message: "Comic slug and chapter slug are required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const chapterData = await findChapterReaderPages(db, comicSlug, chapterSlug, env);

  if (!chapterData) {
    throw new HTTPError({ status: 404, message: "Chapter not found." });
  }

  return {
    status: "ok",
    data: chapterData,
  };
});

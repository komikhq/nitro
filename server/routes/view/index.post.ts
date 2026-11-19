import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { recordView } from "@/server/operations/views";
import { ViewRecordSchema } from "@/server/schemas";

defineRouteMeta({
  openAPI: {
    tags: ["Views"],
    operationId: "recordComicView",
    summary: "Record comic/chapter view",
    description: "Logs a view data point into Cloudflare Analytics Engine dataset.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["comicId"],
            properties: {
              comicId: { type: "string", format: "uuid" },
              chapterId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "View recorded successfully." },
      400: { description: "Invalid payload." },
    },
  },
});

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const parsed = ViewRecordSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for recording view." });
  }

  const env = useCloudflareEnv(event);
  await recordView(env, parsed.data.comicId, parsed.data.chapterId);

  return {
    status: "ok",
    message: "View recorded successfully.",
  };
});

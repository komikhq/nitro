import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { recordView } from "@/server/operations/views";
import { ViewRecordSchema } from "@/server/schemas";

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

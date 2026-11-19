import { defineHandler, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { ViewService } from "@/server/services/view.service";
import { ViewRecordSchema } from "@/server/schemas";

export default defineHandler(async (event) => {
  const body = await readBody(event);
  const parsed = ViewRecordSchema.safeParse(body);

  if (!parsed.success) {
    throw new HTTPError({ status: 400, message: "Invalid payload for recording view." });
  }

  const env = useCloudflareEnv(event);
  const service = new ViewService(env);

  await service.recordView(parsed.data.comicId, parsed.data.chapterId);

  return {
    status: "ok",
    message: "View recorded successfully.",
  };
});

import { defineHandler, HTTPError } from "nitro";
import { getQuery, getHeader } from "nitro/h3";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const channel = (query.channel as string) || "global_presence";
  const upgradeHeader = getHeader(event, "Upgrade");

  if (upgradeHeader !== "websocket") {
    throw new HTTPError({ status: 400, message: "Expected Upgrade: websocket" });
  }

  const env = useCloudflareEnv(event);

  if (channel === "global_presence" && env.GLOBAL_PRESENCE_DO) {
    const id = env.GLOBAL_PRESENCE_DO.idFromName("global_presence");
    const stub = env.GLOBAL_PRESENCE_DO.get(id);
    return stub.fetch(event.req as unknown as Request);
  }

  if (channel.startsWith("comment_stream:") && env.COMMENT_STREAM_DO) {
    const id = env.COMMENT_STREAM_DO.idFromName(channel);
    const stub = env.COMMENT_STREAM_DO.get(id);
    return stub.fetch(event.req as unknown as Request);
  }

  throw new HTTPError({ status: 400, message: "Invalid channel or Durable Object binding missing" });
});

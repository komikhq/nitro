import { defineHandler } from "nitro";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export default defineHandler((event) => {
  const env = useCloudflareEnv(event);

  // Test Node.js crypto & Buffer APIs on Cloudflare Workers runtime
  const testBuffer = Buffer.from("komikhq-nitro-workers", "utf-8").toString("base64");
  const testHash = crypto.createHash("sha256").update("komikhq-test").digest("hex");

  return {
    status: "ok",
    nodeCompat: {
      bufferBase64: testBuffer,
      sha256: testHash,
      isNodeProcessAvailable: typeof process !== "undefined" && typeof process.cwd === "function",
    },
    hasKvKomikhq: Boolean(env?.KV_KOMIKHQ),
    hasKvViews: Boolean(env?.KV_VIEWS),
    hasBucketUsers: Boolean(env?.BUCKET_USERS),
    hasBucketMedia: Boolean(env?.BUCKET_MEDIA),
    hasAeViews: Boolean(env?.AE_COMIC_VIEWS),
    hasGlobalPresenceDO: Boolean(env?.GLOBAL_PRESENCE_DO),
    hasCommentStreamDO: Boolean(env?.COMMENT_STREAM_DO),
    keys: Object.keys(env || {}),
  };
});

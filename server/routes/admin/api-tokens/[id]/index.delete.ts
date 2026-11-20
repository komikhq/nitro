import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { requireAdmin } from "@/server/utils/protect";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import type { ApiTokenRecord } from "./index.get";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminRevokeApiToken",
    summary: "Revoke an API token",
    description: "Revokes and deletes an API token by ID. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Token ID" },
    ],
    responses: {
      200: {
        description: "Token revoked successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                message: { type: "string" },
              },
            },
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
    throw new HTTPError({ status: 400, message: "Token ID is required." });
  }

  const env = useCloudflareEnv(event);

  if (env?.KV_KOMIKHQ) {
    try {
      const raw = await env.KV_KOMIKHQ.get("admin:api_tokens");
      if (raw) {
        let tokens: ApiTokenRecord[] = JSON.parse(raw);
        tokens = tokens.filter((t) => t.id !== id);
        await env.KV_KOMIKHQ.put("admin:api_tokens", JSON.stringify(tokens));
      }
    } catch (e) {
      console.warn("[adminRevokeApiToken] KV error:", e);
    }
  }

  return {
    status: "ok",
    success: true,
    message: "API token revoked successfully.",
  };
});

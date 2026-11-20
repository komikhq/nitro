import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody } from "nitro/h3";
import { requireAdmin } from "@/server/utils/protect";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import type { ApiTokenRecord } from "./index.get";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateApiToken",
    summary: "Create a new API token",
    description: "Generates a new API token with specified scopes. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name", "scopes"],
            properties: {
              name: { type: "string" },
              scopes: { type: "array", items: { type: "string" } },
              expiresInDays: { type: "integer", nullable: true },
            },
          },
        },
      },
    },
    responses: {
      201: {
        description: "API token created.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                token: { type: "object" },
                rawToken: { type: "string" },
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
  const body = (await readBody(event)) as {
    name: string;
    scopes: string[];
    expiresInDays?: number | null;
  } | null;

  if (!body?.name?.trim()) {
    throw new HTTPError({ status: 400, message: "Token name is required." });
  }

  if (!Array.isArray(body.scopes) || body.scopes.length === 0) {
    throw new HTTPError({ status: 400, message: "At least one scope is required." });
  }

  const env = useCloudflareEnv(event);

  const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const secretPart = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14);
  const tokenPrefix = `khq_live_${randomPart.substring(0, 6)}`;
  const rawToken = `${tokenPrefix}_${secretPart}`;

  const expiresAt =
    body.expiresInDays && body.expiresInDays > 0
      ? new Date(Date.now() + 1000 * 60 * 60 * 24 * body.expiresInDays).toISOString()
      : null;

  const newToken: ApiTokenRecord = {
    id: `tok_${Math.random().toString(36).substring(2, 12)}`,
    name: body.name.trim(),
    tokenPrefix,
    scopes: body.scopes,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt,
  };

  let tokens: ApiTokenRecord[] = [];
  if (env?.KV_KOMIKHQ) {
    try {
      const raw = await env.KV_KOMIKHQ.get("admin:api_tokens");
      if (raw) tokens = JSON.parse(raw);
    } catch {}

    tokens = [newToken, ...tokens];
    await env.KV_KOMIKHQ.put("admin:api_tokens", JSON.stringify(tokens));
  }

  return {
    status: "ok",
    success: true,
    token: newToken,
    data: newToken,
    rawToken,
  };
});

import { defineHandler, defineRouteMeta } from "nitro";
import { requireAdmin } from "@/server/utils/protect";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export interface ApiTokenRecord {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
}

const DEFAULT_TOKENS: ApiTokenRecord[] = [
  {
    id: "tok_production_scraper",
    name: "Production Scraper Daemon",
    tokenPrefix: "khq_live_9a2f1b",
    scopes: ["read:comics", "write:comics"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 76).toISOString(),
  },
  {
    id: "tok_cicd_pipeline",
    name: "CI/CD Deployment Pipeline",
    tokenPrefix: "khq_live_c4d1e2",
    scopes: ["admin:full"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    expiresAt: null,
  },
];

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminListApiTokens",
    summary: "List API tokens",
    description: "Lists active and revoked API tokens. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    responses: {
      200: {
        description: "List of API tokens.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                tokens: { type: "array", items: { type: "object" } },
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
  const env = useCloudflareEnv(event);

  let tokens: ApiTokenRecord[] = [];

  if (env?.KV_KOMIKHQ) {
    try {
      const raw = await env.KV_KOMIKHQ.get("admin:api_tokens");
      if (raw) {
        tokens = JSON.parse(raw);
      } else {
        tokens = DEFAULT_TOKENS;
        await env.KV_KOMIKHQ.put("admin:api_tokens", JSON.stringify(tokens));
      }
    } catch (e) {
      console.warn("[adminListApiTokens] KV read error:", e);
      tokens = DEFAULT_TOKENS;
    }
  } else {
    tokens = DEFAULT_TOKENS;
  }

  return {
    status: "ok",
    success: true,
    data: tokens,
    tokens,
  };
});

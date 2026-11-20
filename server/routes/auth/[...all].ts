import { defineHandler, defineRouteMeta } from "nitro";
import { useAuth } from "@/server/utils/auth";

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    operationId: "betterAuthHandler",
    summary: "Better Auth wild-card handler",
    description: "Handles Better Auth operations including sign-in (Email, Google, Discord, Facebook), sign-up, sign-out, session retrieval, OAuth callbacks, Bearer tokens, JWT token issuance (/auth/token), and public JWKS (/auth/jwks).",
    responses: {
      200: { description: "Better Auth handled response" },
    },
  },
});

export default defineHandler(async (event) => {
  const auth = useAuth(event);
  return auth.handler(event.req as unknown as Request);
});

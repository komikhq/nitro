import { defineHandler, defineRouteMeta } from "nitro";
import { getRequestURL, readRawBody } from "nitro/h3";
import { useAuth } from "@/server/utils/auth";

defineRouteMeta({
  openAPI: {
    tags: ["Authentication"],
    operationId: "betterAuthHandler",
    summary: "Better Auth wild-card handler",
    description:
      "Handles Better Auth operations including sign-in (Email, Google, Discord, Facebook), sign-up, sign-out, session retrieval, OAuth callbacks, Bearer tokens, JWT token issuance (/auth/token), and public JWKS (/auth/jwks).",
    responses: {
      200: { description: "Better Auth handled response" },
    },
  },
});

export default defineHandler(async (event) => {
  try {
    const auth = useAuth(event);

    // In Nitro Cloudflare preset, event.web?.request provides the native WHATWG Request.
    // If available with an absolute URL, use it directly; otherwise construct one from H3 event.
    const nativeRequest = (event.web as any)?.request;
    let request: Request;
    if (nativeRequest instanceof Request && nativeRequest.url.startsWith("http")) {
      request = nativeRequest;
    } else {
      const url = getRequestURL(event);
      const method = event.method;
      const headers = event.headers;
      const body = ["GET", "HEAD"].includes(method)
        ? undefined
        : await readRawBody(event);

      request = new Request(url.href, {
        method,
        headers,
        body,
      });
    }

    return await auth.handler(request);
  } catch (error: any) {
    console.error("[Better Auth Handler Exception]:", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: error?.message || "Internal authentication error",
      }),
      {
        status: error?.status && error.status >= 400 && error.status < 600 ? error.status : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

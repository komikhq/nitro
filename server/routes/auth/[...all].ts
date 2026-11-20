import { defineHandler, defineRouteMeta } from "nitro";
import { getRequestURL, readRawBody } from "nitro/h3";
import { useAuth } from "@/server/utils/auth";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { toPublicUrl, type StorageEnv } from "@/server/lib/storage";

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

    const response = await auth.handler(request);
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        const cloned = response.clone();
        const data: any = await cloned.json();
        if (data && typeof data === "object") {
          const env = useCloudflareEnv(event) as unknown as Partial<StorageEnv>;
          let modified = false;

          if (data.user && typeof data.user === "object" && data.user.image) {
            data.user.image = toPublicUrl(data.user.image, "users", env) ?? data.user.image;
            modified = true;
          }
          if (data.image && typeof data.image === "string") {
            data.image = toPublicUrl(data.image, "users", env) ?? data.image;
            modified = true;
          }

          if (modified) {
            const newHeaders = new Headers(response.headers);
            newHeaders.delete("content-length");
            return new Response(JSON.stringify(data), {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
          }
        }
      } catch {
        // Fallback to original response on parsing errors
      }
    }

    return response;
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

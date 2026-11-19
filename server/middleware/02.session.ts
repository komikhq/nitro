import { defineMiddleware } from "nitro/h3";
import { useAuth } from "@/server/utils/auth";
import { toPublicUrl } from "@/server/lib/storage";
import { useCloudflareEnv } from "@/server/utils/cloudflare";

export interface UserSessionPayload {
  id: string;
  userId: string;
  email: string;
  name: string;
  role?: string;
  image?: string | null;
}

export default defineMiddleware(async (event) => {
  // Skip auth checks on auth routes
  if (event.path.startsWith("/auth/")) {
    return;
  }

  try {
    const auth = useAuth(event);
    const sessionData = await auth.api.getSession({
      headers: event.req.headers,
    });

    if (sessionData?.user) {
      const env = useCloudflareEnv(event);
      const userPayload: UserSessionPayload = {
        id: sessionData.user.id,
        userId: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: (sessionData.user as any).role || "user",
        image: toPublicUrl(sessionData.user.image, "users", env) ?? sessionData.user.image,
      };

      event.context.user = userPayload;
      event.context.session = sessionData.session;
    }
  } catch (err) {
    console.warn("[Auth Middleware] Failed to resolve session from database:", err);
  }
});

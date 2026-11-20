import { betterAuth } from "better-auth";
import { admin, bearer, jwt } from "better-auth/plugins";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { H3Event } from "nitro/h3";
import { useDb } from "./db";
import * as schema from "@/server/db/schema";
import { useCloudflareEnv } from "./cloudflare";
import { sendEmail } from "@/server/lib/email";
import { renderVerificationEmailTemplate } from "@/server/lib/email/templates/verification";
import { renderResetPasswordEmailTemplate } from "@/server/lib/email/templates/reset-password";
import { uploadToR2, type StorageEnv } from "@/server/lib/storage";

let _authInstance: any = null;

/**
 * Access Better Auth instance.
 * Lazily initializes with Drizzle adapter and dynamic environment values.
 */
export function useAuth(event?: H3Event) {
  if (_authInstance) {
    return _authInstance;
  }

  const env = event ? useCloudflareEnv(event) : ((globalThis as any).__env__ || (process.env as any));
  const db = useDb(event);

  _authInstance = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
        username: { type: "string", required: false, input: false },
      },
    },
    secret: env?.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "default_secret_for_dev_min_32_characters",
    baseURL: env?.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "https://nitro.komikhq.dpdns.org",
    basePath: "/auth", // No /v1, No /api prefix
    trustedOrigins: [
      "https://komikhq.com",
      "https://www.komikhq.com",
      "https://komikhq.dpdns.org",
      "https://nitro.komikhq.dpdns.org",
      "http://localhost:5173",
      "http://localhost:4321",
      "http://localhost:3000",
    ],
    advanced: {
      cookiePrefix: "komikhq",
      useSecureCookies: false,
      crossSubDomainCookies: {
        enabled: true,
        domain: (env?.BETTER_AUTH_URL || "").includes("localhost") ? undefined : ".komikhq.dpdns.org",
      },
      defaultCookieAttributes: {
        domain: (env?.BETTER_AUTH_URL || "").includes("localhost") ? undefined : ".komikhq.dpdns.org",
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!user.image) return;
            const isExternalAvatar =
              /googleusercontent\.com|ggpht\.com|google\.com/i.test(user.image) ||
              (user.image.startsWith("http") &&
                Boolean(env?.BUCKET_URL_USERS) &&
                !user.image.includes(env?.BUCKET_URL_USERS!));

            if (isExternalAvatar && env?.BUCKET_USERS) {
              try {
                const res = await fetch(user.image);
                if (res.ok) {
                  const contentType = res.headers.get("content-type") || "image/jpeg";
                  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
                  const arrayBuffer = await res.arrayBuffer();
                  const objectKey = `avatars/google-${user.id || Date.now()}.${ext}`;
                  const imageKey = await uploadToR2(env as StorageEnv, "users", objectKey, arrayBuffer, { contentType });
                  return { data: { ...user, image: imageKey } };
                }
              } catch (e) {
                console.error("[Auth] Failed to mirror Google avatar to R2:", e);
              }
            }
            return;
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }) => {
        const { subject, html, text } = renderResetPasswordEmailTemplate({
          userName: user.name || "KomikHQ User",
          resetUrl: url,
        });
        await sendEmail({ to: user.email, subject, html, text }, event);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        try {
          const { subject, html, text } = renderVerificationEmailTemplate({
            userName: user.name || "KomikHQ User",
            verificationUrl: url,
          });
          await sendEmail({ to: user.email, subject, html, text }, event);
        } catch (err) {
          console.error(`[Auth] Failed to send verification email to ${user.email}:`, err);
          throw err;
        }
      },
    },
    socialProviders: {
      google: {
        clientId: env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
        enabled: Boolean(
          (env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID) &&
          (env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET)
        ),
        prompt: "select_account consent",
        accessType: "offline",
        scope: ["openid", "profile", "email"],
        mapProfileToUser: async (profile) => ({
          image: profile.picture || (profile as any).avatar_url || null,
        }),
      },
    },
    plugins: [admin(), bearer(), jwt()],
  });

  return _authInstance;
}

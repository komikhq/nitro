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
let _authEnvSignature: string | null = null;

/**
 * Access Better Auth instance.
 * Lazily initializes with Drizzle adapter and dynamic environment values.
 */
export function useAuth(event?: H3Event) {
  const env = event ? useCloudflareEnv(event) : ((globalThis as any).__env__ || (process.env as any));
  const db = useDb(event);

  const databaseUrl = env?.DATABASE_URL || process.env.DATABASE_URL || "";
  const googleClientId = env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const discordClientId = (env as any)?.DISCORD_CLIENT_ID || process.env.DISCORD_CLIENT_ID || "";
  const facebookClientId = (env as any)?.FACEBOOK_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID || "";
  const envSig = `${databaseUrl}:${googleClientId}:${discordClientId}:${facebookClientId}`;

  if (_authInstance && _authEnvSignature === envSig) {
    return _authInstance;
  }

  const baseUrl =
    env?.BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    "https://api.komikhq.com";

  const cookieDomain = baseUrl.includes("localhost")
    ? undefined
    : baseUrl.includes("komikhq.com")
    ? ".komikhq.com"
    : baseUrl.includes("komikhq.dpdns.org")
    ? ".komikhq.dpdns.org"
    : undefined;

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
    baseURL: baseUrl,
    basePath: "/auth", // No /v1, No /api prefix
    trustedOrigins: [
      "https://komikhq.com",
      "https://www.komikhq.com",
      "https://api.komikhq.com",
      "https://komikhq.dpdns.org",
      "https://nitro.komikhq.dpdns.org",
      "http://localhost:5173",
      "http://localhost:4321",
      "http://localhost:3000",
      "komikhq://",
      "exp://",
    ],
    advanced: {
      cookiePrefix: "komikhq",
      useSecureCookies: false,
      crossSubDomainCookies: {
        enabled: Boolean(cookieDomain),
        domain: cookieDomain,
      },
      defaultCookieAttributes: {
        domain: cookieDomain,
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
              /googleusercontent\.com|ggpht\.com|google\.com|discordapp\.com|cdn\.discordapp\.com|fbcdn\.net|facebook\.com/i.test(user.image) ||
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
                  const objectKey = `avatars/oauth-${user.id || Date.now()}.${ext}`;
                  const imageKey = await uploadToR2(env as StorageEnv, "users", objectKey, arrayBuffer, { contentType });
                  return { data: { ...user, image: imageKey } };
                }
              } catch (e) {
                console.error("[Auth] Failed to mirror external OAuth avatar to R2:", e);
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
      ...(env?.GOOGLE_CLIENT_ID && env?.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
              prompt: "select_account consent",
              accessType: "offline",
              scope: ["openid", "profile", "email"],
              mapProfileToUser: async (profile: any) => ({
                image: profile.picture || profile.avatar_url || undefined,
              }),
            },
          }
        : {}),
      ...((env as any)?.DISCORD_CLIENT_ID && (env as any)?.DISCORD_CLIENT_SECRET
        ? {
            discord: {
              clientId: (env as any).DISCORD_CLIENT_ID,
              clientSecret: (env as any).DISCORD_CLIENT_SECRET,
              scope: ["identify", "email"],
              mapProfileToUser: async (profile: any) => ({
                image: profile.avatar
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                  : undefined,
              }),
            },
          }
        : {}),
      ...((env as any)?.FACEBOOK_CLIENT_ID && (env as any)?.FACEBOOK_CLIENT_SECRET
        ? {
            facebook: {
              clientId: (env as any).FACEBOOK_CLIENT_ID,
              clientSecret: (env as any).FACEBOOK_CLIENT_SECRET,
              scope: ["email", "public_profile"],
              mapProfileToUser: async (profile: any) => ({
                image: profile.picture?.data?.url || profile.avatar_url || undefined,
              }),
            },
          }
        : {}),
    },
    plugins: [admin(), bearer(), jwt()],
  });

  _authEnvSignature = envSig;
  return _authInstance;
}

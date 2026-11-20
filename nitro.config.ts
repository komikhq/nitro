import { fileURLToPath } from "node:url";
import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  preset: "cloudflare_module",
  compatibilityDate: "2026-09-05",
  serverEntry: "./server/entry.ts",
  alias: {
    "@": fileURLToPath(new URL("./", import.meta.url)),
    "~": fileURLToPath(new URL("./", import.meta.url)),
  },
  experimental: {
    tasks: true,
    openAPI: true,
  },
  openAPI: {
    meta: {
      title: "KomikHQ API",
      description: "Official REST and Realtime WebSocket API for KomikHQ Platform",
      version: "1.0.0",
    },
    production: "runtime",
    route: "/_openapi.json",
    ui: {
      scalar: {
        route: "/docs",
      },
      swagger: {
        route: "/swagger",
      },
    },
  },
  runtimeConfig: {
    databaseUrl: "",
    betterAuthSecret: "",
    betterAuthUrl: "https://nitro.komikhq.dpdns.org",
    googleClientId: "",
    googleClientSecret: "",
    bucketUrlUsers: "https://cdn-01.komikhq.dpdns.org",
    bucketUrlMedia: "https://cdn-02.komikhq.dpdns.org",
    emailProvider: "resend",
    emailFrom: "KomikHQ <no-reply@komikhq.com>",
    resendApiKey: "",
    brevoApiKey: "",
  },
  scheduledTasks: {
    "0 * * * *": ["rankings:refresh"],
    "0 */6 * * *": ["views:sync-delta", "rankings:refresh"],
  },
  cloudflare: {
    nodeCompat: true,
  },
});

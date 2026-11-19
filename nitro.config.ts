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
  },
  scheduledTasks: {
    "0 * * * *": ["rankings:refresh"],
    "0 */6 * * *": ["views:sync-delta", "rankings:refresh"],
  },
  cloudflare: {
    nodeCompat: true,
    wrangler: {
      compatibility_flags: ["nodejs_compat"],
    },
  },
});

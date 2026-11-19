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
  cloudflare: {
    nodeCompat: true,
    wrangler: {
      compatibility_flags: ["nodejs_compat"],
    },
  },
});

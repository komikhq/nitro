import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("cloudflare:scheduled" as any, async ({ controller, env, context }: { controller: ScheduledController; env: CloudflareBindings; context: ExecutionContext }) => {
    console.log(`[Cloudflare Cron] Triggered cron: ${controller.cron}`);

    if (controller.cron === "0 */6 * * *") {
      context.waitUntil(
        (async () => {
          console.log("[Cloudflare Cron] Running syncViewsDelta & refreshRankings");
          // Cron logic will be invoked here
        })()
      );
    } else {
      context.waitUntil(
        (async () => {
          console.log("[Cloudflare Cron] Running refreshRankings");
          // Cron logic will be invoked here
        })()
      );
    }
  });
});

import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook(
    "cloudflare:scheduled" as any,
    async ({
      controller,
      env,
      context,
    }: {
      controller: ScheduledController;
      env: any;
      context: ExecutionContext;
    }) => {
      console.log(`[Cloudflare Cron] Scheduled event triggered: ${controller.cron}`);
    },
  );
});

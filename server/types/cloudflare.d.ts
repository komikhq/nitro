import type { UserSessionPayload } from "../middleware/02.session";

declare module "h3" {
  interface H3EventContext {
    cf?: IncomingRequestCfProperties;
    user?: UserSessionPayload;
    session?: any;
  }
}

export type AppCloudflareEnv = CloudflareBindings;

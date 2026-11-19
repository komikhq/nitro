declare module "h3" {
  interface H3EventContext {
    cf?: IncomingRequestCfProperties;
  }
}

export type AppCloudflareEnv = CloudflareBindings;

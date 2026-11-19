import type { H3Event } from "nitro/h3";

/**
 * Access typed Cloudflare bindings from H3Event runtime context
 */
export function useCloudflareEnv(event: H3Event): CloudflareBindings {
  const env = (event.runtime as any)?.cloudflare?.env || (globalThis as any).__env__ || (process.env as any);
  return env as CloudflareBindings;
}

/**
 * Access Cloudflare ExecutionContext (for waitUntil)
 */
export function useCloudflareContext(event: H3Event): ExecutionContext | undefined {
  return (event.runtime as any)?.cloudflare?.context;
}

/**
 * Perform background execution via waitUntil if supported, or fire-and-forget
 */
export function useWaitUntil(event: H3Event, promise: Promise<any>): void {
  if (typeof event.waitUntil === "function") {
    event.waitUntil(promise);
  } else {
    const ctx = useCloudflareContext(event);
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(promise);
    } else {
      promise.catch((err) => console.error("Unhandled background task error:", err));
    }
  }
}

import type { H3Event } from "nitro/h3";

/**
 * Access typed Cloudflare bindings from H3Event runtime context.
 * Safely resolves bindings across Nitro v2, Nitro v3, and Cloudflare Worker module standards.
 */
export function useCloudflareEnv(event?: H3Event): CloudflareBindings {
  if (!event) {
    return ((globalThis as any).__env__ || (process.env as any)) as CloudflareBindings;
  }

  const env =
    (event.context as any)?.cloudflare?.env ||
    (event as any)?.runtime?.cloudflare?.env ||
    (event as any)?.req?.runtime?.cloudflare?.env ||
    (event.context as any)?.env ||
    (globalThis as any).__env__ ||
    (process.env as any);

  return env as CloudflareBindings;
}

/**
 * Access Cloudflare ExecutionContext (for waitUntil)
 */
export function useCloudflareContext(event: H3Event): ExecutionContext | undefined {
  return (
    (event.context as any)?.cloudflare?.context ||
    (event as any)?.runtime?.cloudflare?.context ||
    (event as any)?.req?.runtime?.cloudflare?.context
  );
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

import { HTTPError, type H3Event } from "nitro";

export function requireUser(event: H3Event) {
  const user = event.context.user;

  if (!user) {
    throw new HTTPError({
      status: 401,
      statusText: "Unauthorized",
      message: "Authentication is required.",
    });
  }

  return user;
}

export function requireAdmin(event: H3Event) {
  const user = requireUser(event);

  if (user.role !== "admin") {
    throw new HTTPError({
      status: 403,
      statusText: "Forbidden",
      message: "Administrator access is required.",
    });
  }

  return user;
}

import { defineHandler } from "nitro";
import { useAuth } from "@/server/utils/auth";

export default defineHandler(async (event) => {
  const auth = useAuth(event);
  return auth.handler(event.req as unknown as Request);
});

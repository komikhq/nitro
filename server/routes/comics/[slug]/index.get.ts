import { defineHandler, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicBySlug } from "@/server/operations/comics";

export default defineHandler(async (event) => {
  const slug = event.context.params?.slug;

  if (!slug) {
    throw new HTTPError({ status: 400, message: "Comic slug is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);

  const comic = await findComicBySlug(db, slug, env);

  if (!comic) {
    throw new HTTPError({ status: 404, message: "Comic not found." });
  }

  return {
    status: "ok",
    data: comic,
  };
});

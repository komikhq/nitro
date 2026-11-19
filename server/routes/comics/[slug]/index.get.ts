import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findComicBySlug } from "@/server/operations/comics";

defineRouteMeta({
  openAPI: {
    tags: ["Comics"],
    operationId: "getComicBySlug",
    summary: "Get comic details by slug",
    description: "Returns detailed metadata for a specific comic by slug, including genres, creators, and chapter list.",
    parameters: [
      { name: "slug", in: "path", required: true, schema: { type: "string" }, description: "Unique comic slug identifier" },
    ],
    responses: {
      200: { description: "Comic details retrieved successfully." },
      404: { description: "Comic not found." },
    },
  },
});

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

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody, readFormData, getRequestHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import {
  createComic,
  processComicCover,
  processComicBanner,
  type CreateComicParams,
} from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminCreateComic",
    summary: "Create a new comic",
    description: "Inserts a new comic record into the catalog with support for direct file uploads or URLs. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            title: "AdminCreateComicJsonRequest",
            type: "object",
            required: ["title", "slug", "coverUrl"],
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string" },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"], default: "manhwa" },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"], default: "ongoing" },
              accessTier: { type: "string", default: "free" },
              genreIds: { type: "array", items: { type: "string" } },
            },
          },
        },
        "multipart/form-data": {
          schema: {
            title: "AdminCreateComicFormDataRequest",
            type: "object",
            required: ["title", "slug"],
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              cover: { type: "string", format: "binary", description: "Cover image file" },
              coverUrlSource: { type: "string", description: "External cover image URL to download" },
              coverUrl: { type: "string", description: "Pre-existing storage object key" },
              banner: { type: "string", format: "binary", description: "Banner image file" },
              bannerUrlSource: { type: "string", description: "External banner image URL to download" },
              bannerUrl: { type: "string", description: "Pre-existing storage object key" },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"], default: "manhwa" },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"], default: "ongoing" },
              accessTier: { type: "string", default: "free" },
              genreIds: { type: "string", description: "JSON stringified array of genre IDs" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Comic created successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: { $ref: "#/components/schemas/Comic" },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid input.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;
  const contentType = getRequestHeader(event, "content-type") || "";

  let comicParams: CreateComicParams;

  if (contentType.includes("multipart/form-data")) {
    const formData = await readFormData(event);
    const title = formData.get("title")?.toString().trim();
    const slug = formData.get("slug")?.toString().trim();

    if (!title || !slug) {
      throw new HTTPError({ status: 400, message: "Title and slug are required." });
    }

    const coverInput = (formData.get("cover") as File | null) ||
      formData.get("coverUrlSource")?.toString().trim() ||
      formData.get("coverUrl")?.toString().trim();

    if (!coverInput) {
      throw new HTTPError({ status: 400, message: "Cover image (cover file, coverUrl, or coverUrlSource) is required." });
    }

    const coverUrl = await processComicCover(env, slug, coverInput);

    const bannerInput = (formData.get("banner") as File | null) ||
      formData.get("bannerUrlSource")?.toString().trim() ||
      formData.get("bannerUrl")?.toString().trim() ||
      undefined;

    const bannerUrl = bannerInput ? await processComicBanner(env, slug, bannerInput) : undefined;

    const synopsis = formData.get("synopsis")?.toString() || undefined;
    const type = formData.get("type")?.toString() || "manhwa";
    const status = formData.get("status")?.toString() || "ongoing";
    const accessTier = formData.get("accessTier")?.toString() || "free";

    let genreIds: string[] | undefined;
    const rawGenres = formData.get("genreIds")?.toString();
    if (rawGenres) {
      try {
        genreIds = JSON.parse(rawGenres);
      } catch {
        genreIds = rawGenres.split(",").map((g) => g.trim()).filter(Boolean);
      }
    }

    comicParams = {
      title,
      slug,
      synopsis,
      coverUrl,
      bannerUrl,
      type,
      status,
      accessTier,
      genreIds,
    };
  } else {
    const body = (await readBody(event)) as CreateComicParams;
    if (!body?.title || !body?.slug || !body?.coverUrl) {
      throw new HTTPError({ status: 400, message: "Title, slug, and coverUrl are required." });
    }
    comicParams = body;
  }

  const comic = await createComic(db, comicParams);

  return {
    status: "ok",
    data: comic,
  };
});

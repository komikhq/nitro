import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody, readFormData, getRequestHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import {
  createComic,
  processComicCover,
  processComicBanner,
  slugify,
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
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              creator: { type: "string", description: "Author / creator name" },
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

    if (!title) {
      throw new HTTPError({ status: 400, message: "Title is required." });
    }

    const providedSlug = formData.get("slug")?.toString().trim();
    const slug = providedSlug || `${slugify(title)}-${Date.now().toString().slice(-4)}`;

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
    const creatorName = formData.get("creator")?.toString().trim() || formData.get("creatorName")?.toString().trim() || undefined;

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
      creatorName,
    };
  } else {
    const body = (await readBody(event)) as any;
    if (!body?.title) {
      throw new HTTPError({ status: 400, message: "Title is required." });
    }

    const slug = body.slug || `${slugify(body.title)}-${Date.now().toString().slice(-4)}`;
    comicParams = {
      ...body,
      slug,
    };
  }

  const comic = await createComic(db, comicParams);

  const resolvedComic = {
    ...comic,
    coverUrl: toPublicUrl(comic.coverUrl, "media", env) ?? comic.coverUrl,
    bannerUrl: toPublicUrl(comic.bannerUrl, "media", env),
  };

  return {
    status: "ok",
    success: true,
    data: resolvedComic,
    comic: resolvedComic,
  };
});

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readBody, readFormData, getRequestHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import {
  updateComicById,
  processComicCover,
  processComicBanner,
  type UpdateComicParams,
} from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUpdateComic",
    summary: "Update comic by ID",
    description: "Updates comic metadata by ID with support for direct file uploads or JSON. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Comic ID" },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string" },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string" },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"] },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"] },
              accessTier: { type: "string" },
              genreIds: { type: "array", items: { type: "string" } },
            },
          },
        },
        "multipart/form-data": {
          schema: {
            type: "object",
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
              type: { type: "string", enum: ["manga", "manhwa", "manhua"] },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"] },
              accessTier: { type: "string" },
              genreIds: { type: "string", description: "JSON stringified array of genre IDs" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Comic updated successfully.",
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
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
      404: {
        description: "Comic not found.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const id = event.context.params?.id;

  if (!id) {
    throw new HTTPError({ status: 400, message: "Comic ID is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;
  const contentType = getRequestHeader(event, "content-type") || "";

  let updateParams: UpdateComicParams;

  if (contentType.includes("multipart/form-data")) {
    const formData = await readFormData(event);
    const title = formData.get("title")?.toString().trim() || undefined;
    const slug = formData.get("slug")?.toString().trim() || undefined;
    const synopsis = formData.get("synopsis")?.toString() || undefined;
    const type = formData.get("type")?.toString() || undefined;
    const status = formData.get("status")?.toString() || undefined;
    const accessTier = formData.get("accessTier")?.toString() || undefined;

    const fileSlug = slug || id;

    const coverInput = (formData.get("cover") as File | null) ||
      formData.get("coverUrlSource")?.toString().trim() ||
      formData.get("coverUrl")?.toString().trim() ||
      undefined;

    const coverUrl = coverInput ? await processComicCover(env, fileSlug, coverInput) : undefined;

    const bannerInput = (formData.get("banner") as File | null) ||
      formData.get("bannerUrlSource")?.toString().trim() ||
      formData.get("bannerUrl")?.toString().trim() ||
      undefined;

    const bannerUrl = bannerInput ? await processComicBanner(env, fileSlug, bannerInput) : undefined;

    let genreIds: string[] | undefined;
    const rawGenres = formData.get("genreIds")?.toString();
    if (rawGenres) {
      try {
        genreIds = JSON.parse(rawGenres);
      } catch {
        genreIds = rawGenres.split(",").map((g) => g.trim()).filter(Boolean);
      }
    }

    updateParams = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(synopsis !== undefined && { synopsis }),
      ...(coverUrl && { coverUrl }),
      ...(bannerUrl && { bannerUrl }),
      ...(type && { type }),
      ...(status && { status }),
      ...(accessTier && { accessTier }),
      ...(genreIds && { genreIds }),
    };
  } else {
    updateParams = (await readBody(event)) as UpdateComicParams;
  }

  const comic = await updateComicById(db, id, updateParams);

  if (!comic) {
    throw new HTTPError({ status: 404, message: "Comic not found." });
  }

  return {
    status: "ok",
    data: comic,
  };
});

import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readFormData } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireAdmin } from "@/server/utils/protect";
import { uploadChapterPage } from "@/server/operations/admin";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Administration"],
    operationId: "adminUploadChapterPage",
    summary: "Upload chapter page image",
    description: "Uploads a single page image file directly to R2 storage and associates it with the specified chapter. Requires administrator privileges.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Chapter ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["file", "pageNumber"],
            properties: {
              file: { type: "string", format: "binary", description: "Image file" },
              pageNumber: { type: "integer", description: "Page order index" },
              width: { type: "integer", description: "Optional image width" },
              height: { type: "integer", description: "Optional image height" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Chapter page uploaded successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    pageNumber: { type: "integer" },
                    imageUrl: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid input or file missing.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
      403: { description: "Forbidden." },
      404: { description: "Chapter not found." },
    },
  },
});

export default defineHandler(async (event) => {
  requireAdmin(event);
  const chapterId = event.context.params?.id;

  if (!chapterId) {
    throw new HTTPError({ status: 400, message: "Chapter ID is required." });
  }

  const formData = await readFormData(event);
  const file = formData?.get("file");

  if (!file || !(file instanceof File) || file.size === 0) {
    throw new HTTPError({ status: 400, message: "Valid image file is required." });
  }

  const rawPageNumber = formData?.get("pageNumber")?.toString();
  const pageNumber = rawPageNumber ? parseInt(rawPageNumber, 10) : NaN;

  if (Number.isNaN(pageNumber) || pageNumber < 1) {
    throw new HTTPError({ status: 400, message: "Valid pageNumber (positive integer) is required." });
  }

  const rawWidth = formData?.get("width")?.toString();
  const width = rawWidth ? parseInt(rawWidth, 10) : undefined;
  const rawHeight = formData?.get("height")?.toString();
  const height = rawHeight ? parseInt(rawHeight, 10) : undefined;

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  try {
    const page = await uploadChapterPage(db, env, {
      chapterId,
      file,
      pageNumber,
      width,
      height,
    });

    return {
      status: "ok",
      data: page,
    };
  } catch (err: any) {
    if (err.message === "Chapter not found." || err.message === "Parent comic not found.") {
      throw new HTTPError({ status: 404, message: err.message });
    }
    throw new HTTPError({ status: 500, message: err.message || "Failed to upload chapter page." });
  }
});

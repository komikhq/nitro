import { defineHandler, defineRouteMeta, HTTPError } from "nitro";
import { readFormData } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { requireUser } from "@/server/utils/protect";
import { updateUserAvatar } from "@/server/operations/users";
import type { StorageEnv } from "@/server/lib/storage";

defineRouteMeta({
  openAPI: {
    tags: ["Users"],
    operationId: "uploadUserAvatar",
    summary: "Upload profile avatar image",
    description: "Uploads an image file to R2 storage and updates the user's avatar URL.",
    security: [{ SessionCookie: [] }, { BearerToken: [] }],
    requestBody: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            required: ["file"],
            properties: {
              file: { type: "string", format: "binary", description: "Image file to upload" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "Avatar updated successfully.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    avatarUrl: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid file.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      401: { description: "Unauthorized." },
    },
  },
});

export default defineHandler(async (event) => {
  const sessionUser = requireUser(event);
  const formData = await readFormData(event);

  const file = formData?.get("file");
  if (!file || typeof file === "string" || !(file instanceof File)) {
    throw new HTTPError({ status: 400, message: "Valid image file is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event) as unknown as StorageEnv;

  try {
    const avatarUrl = await updateUserAvatar(db, sessionUser.id, file, env);
    return {
      status: "ok",
      data: {
        avatarUrl,
      },
    };
  } catch (err: any) {
    throw new HTTPError({
      status: 500,
      message: err.message || "Failed to upload avatar.",
    });
  }
});

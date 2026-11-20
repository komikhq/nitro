import { defineHandler, defineRouteMeta } from "nitro";

defineRouteMeta({
  openAPI: {
    $global: {
      components: {
        securitySchemes: {
          SessionCookie: {
            type: "apiKey",
            in: "cookie",
            name: "komikhq.session_token",
            description: "KomikHQ session cookie managed by Better Auth.",
          },
          BearerToken: {
            type: "http",
            scheme: "bearer",
            description: "A valid KomikHQ bearer session token.",
          },
        },
        schemas: {
          ErrorResponse: {
            type: "object",
            properties: {
              error: { type: "string", example: "Request failed." },
              details: { type: "object" },
            },
            required: ["error"],
          },
          SuccessResponse: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              message: { type: "string" },
            },
            required: ["status"],
          },
          Pagination: {
            type: "object",
            properties: {
              page: { type: "integer", minimum: 1 },
              limit: { type: "integer", minimum: 1 },
              total: { type: "integer", minimum: 0 },
              totalPages: { type: "integer", minimum: 0 },
            },
            required: ["page", "limit", "total", "totalPages"],
          },
          Comic: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string", nullable: true },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string", nullable: true },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"] },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"] },
              accessTier: { type: "string" },
              totalChapters: { type: "integer" },
              totalViews: { type: "integer" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              genres: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    slug: { type: "string" },
                  },
                },
              },
            },
          },
          Chapter: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              comicId: { type: "string", format: "uuid" },
              chapterNumber: { type: "string" },
              title: { type: "string", nullable: true },
              slug: { type: "string" },
              totalPages: { type: "integer" },
              totalViews: { type: "integer" },
              publishedAt: { type: "string", format: "date-time" },
            },
          },
          Genre: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              slug: { type: "string" },
              description: { type: "string", nullable: true },
            },
          },
          Comment: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              content: { type: "string" },
              likesCount: { type: "integer" },
              createdAt: { type: "string", format: "date-time" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  image: { type: "string", nullable: true },
                },
              },
            },
          },
          UserProfile: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" },
              image: { type: "string", nullable: true },
              role: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
            },
          },
          ComicDetail: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              slug: { type: "string" },
              synopsis: { type: "string", nullable: true },
              coverUrl: { type: "string" },
              bannerUrl: { type: "string", nullable: true },
              type: { type: "string", enum: ["manga", "manhwa", "manhua"] },
              status: { type: "string", enum: ["ongoing", "completed", "hiatus"] },
              accessTier: { type: "string" },
              totalChapters: { type: "integer" },
              totalViews: { type: "integer" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              genres: {
                type: "array",
                items: { $ref: "#/components/schemas/Genre" },
              },
              creators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    role: { type: "string", enum: ["author", "artist"] },
                  },
                },
              },
              chapters: {
                type: "array",
                items: { $ref: "#/components/schemas/Chapter" },
              },
            },
          },
          ChapterPage: {
            type: "object",
            properties: {
              id: { type: "string" },
              pageNumber: { type: "integer" },
              imageUrl: { type: "string" },
            },
          },
          Bookmark: {
            type: "object",
            properties: {
              id: { type: "string" },
              comicId: { type: "string", format: "uuid" },
              userId: { type: "string" },
              createdAt: { type: "string", format: "date-time" },
              comic: { $ref: "#/components/schemas/Comic" },
            },
          },
          ReadingHistory: {
            type: "object",
            properties: {
              id: { type: "string" },
              comicId: { type: "string", format: "uuid" },
              chapterId: { type: "string", format: "uuid" },
              lastPage: { type: "integer" },
              updatedAt: { type: "string", format: "date-time" },
              comic: { $ref: "#/components/schemas/Comic" },
              chapter: { $ref: "#/components/schemas/Chapter" },
            },
          },
          ComicRating: {
            type: "object",
            properties: {
              averageRating: { type: "number" },
              totalRatings: { type: "integer" },
              userRating: { type: "integer", nullable: true },
            },
          },
        },
      },
    },
    tags: ["Root"],
    operationId: "getApiRoot",
    summary: "API root health welcome",
    description: "Returns greeting message from KomikHQ API gateway.",
    responses: {
      200: {
        description: "Welcome message.",
      },
    },
  },
});

export default defineHandler(() => {
  return {
    status: "ok",
    message: "KomikHQ API gateway is active.",
  };
});

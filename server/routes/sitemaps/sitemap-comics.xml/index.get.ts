import { defineHandler, defineRouteMeta } from "nitro";
import { appendHeader, getQuery, getRequestHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { comics } from "@/server/db";
import { desc } from "drizzle-orm";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "getComicsSitemapXml",
    summary: "Comics XML sitemap",
    description: "Generates XML sitemap of all published comics for search engine bots. Supports JSON output via ?format=json or Accept: application/json.",
    parameters: [
      {
        name: "format",
        in: "query",
        required: false,
        schema: { type: "string", enum: ["xml", "json"], default: "xml" },
        description: "Output format (xml or json)",
      },
    ],
    responses: {
      200: {
        description: "XML sitemap or JSON feed.",
        content: {
          "application/xml": {},
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", example: "ok" },
                data: {
                  type: "object",
                  properties: {
                    comics: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          slug: { type: "string" },
                          updatedAt: { type: "string" },
                        },
                      },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  const db = useDb(event);
  const query = getQuery(event);
  const acceptHeader = getRequestHeader(event, "accept") || "";

  const wantsJson = query.format === "json" || acceptHeader.includes("application/json");

  const comicList = await db
    .select({ slug: comics.slug, updatedAt: comics.updatedAt })
    .from(comics)
    .orderBy(desc(comics.updatedAt))
    .limit(50000);

  if (wantsJson) {
    return {
      status: "ok",
      data: {
        comics: comicList,
        total: comicList.length,
      },
    };
  }

  appendHeader(event, "Content-Type", "application/xml; charset=utf-8");

  const urls = comicList
    .map(
      (c) => `
  <url>
    <loc>https://komikhq.dpdns.org/comics/${c.slug}</loc>
    <lastmod>${c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://komikhq.dpdns.org/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;
});

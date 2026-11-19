import { defineHandler, defineRouteMeta } from "nitro";
import { appendHeader } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { comics } from "@/server/db";

defineRouteMeta({
  openAPI: {
    tags: ["Sitemaps"],
    operationId: "getComicSitemapXml",
    summary: "XML sitemap generator",
    description: "Generates dynamic XML sitemap of all indexed comics for search engine bots.",
    responses: {
      200: {
        description: "XML sitemap content.",
        content: {
          "application/xml": {},
        },
      },
    },
  },
});

export default defineHandler(async (event) => {
  appendHeader(event, "Content-Type", "application/xml; charset=utf-8");

  const db = useDb(event);
  const comicList = await db.select({ slug: comics.slug, updatedAt: comics.updatedAt }).from(comics).limit(1000);

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

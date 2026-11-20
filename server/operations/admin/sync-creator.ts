import { creators, comicCreators, type DbClient } from "@/server/db";
import { eq } from "drizzle-orm";

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function syncCreator(db: DbClient, comicId: string, creatorName: string) {
  if (!creatorName || !creatorName.trim()) return;
  const name = creatorName.trim();
  const creatorSlug = slugify(name);

  let [existingCreator] = await db
    .select()
    .from(creators)
    .where(eq(creators.slug, creatorSlug));

  if (!existingCreator) {
    [existingCreator] = await db
      .insert(creators)
      .values({ name, slug: creatorSlug })
      .returning();
  }

  await db.delete(comicCreators).where(eq(comicCreators.comicId, comicId));
  if (existingCreator) {
    await db.insert(comicCreators).values({
      comicId,
      creatorId: existingCreator.id,
      role: "author",
    });
  }
}

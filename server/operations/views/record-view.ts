export async function recordView(
  env?: Partial<CloudflareBindings>,
  comicId?: string,
  chapterId?: string,
) {
  if (!comicId) return { success: false, message: "comicId is required" };

  if (env?.AE_COMIC_VIEWS) {
    try {
      env.AE_COMIC_VIEWS.writeDataPoint({
        blobs: [comicId, chapterId || ""],
        doubles: [1],
        indexes: [comicId],
      });
    } catch (err) {
      console.warn("[recordView] Failed to write to Analytics Engine:", err);
    }
  }

  return { success: true };
}

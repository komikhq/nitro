export class ViewService {
  constructor(private env?: Partial<CloudflareBindings>) {}

  async recordView(comicId: string, chapterId?: string) {
    if (this.env?.AE_COMIC_VIEWS) {
      try {
        this.env.AE_COMIC_VIEWS.writeDataPoint({
          blobs: [comicId, chapterId || ""],
          doubles: [1],
          indexes: [comicId],
        });
      } catch (err) {
        console.warn("[ViewService] Failed to write to Analytics Engine:", err);
      }
    }
    return { success: true };
  }
}

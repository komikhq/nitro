import { z } from "zod";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ComicFilterSchema = PaginationQuerySchema.extend({
  genre: z.string().optional(),
  status: z.enum(["ongoing", "completed"]).optional(),
  type: z.enum(["manga", "manhwa", "manhua"]).optional(),
  sort: z.enum(["latest", "popular", "title", "rating"]).default("latest"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const ViewRecordSchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
});

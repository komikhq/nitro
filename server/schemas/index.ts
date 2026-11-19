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

export const BookmarkUpsertSchema = z.object({
  comicId: z.string().uuid(),
  status: z.enum(["reading", "completed", "plan_to_read", "dropped"]).default("reading"),
});

export const HistoryUpsertSchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid(),
  lastReadPage: z.number().int().min(1).default(1),
  snapshotTotalPages: z.number().int().min(1),
  isCompleted: z.boolean().default(false),
});

export const RatingUpsertSchema = z.object({
  comicId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  reviewText: z.string().max(2000).optional(),
});

export const CommentCreateSchema = z.object({
  comicId: z.string().uuid(),
  chapterId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
  isSpoiler: z.boolean().default(false),
  parentId: z.string().uuid().optional(),
  pageNumber: z.number().int().optional(),
  mentionedUserIds: z.array(z.string()).optional(),
  guestName: z.string().max(50).optional(),
  guestEmail: z.string().email().optional(),
});

export const CommentReportSchema = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "SPOILER", "NSFW", "OTHER"]),
  details: z.string().max(1000).optional(),
  reporterGuestName: z.string().max(50).optional(),
  reporterGuestEmail: z.string().email().optional(),
});

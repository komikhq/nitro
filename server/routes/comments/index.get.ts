import { defineHandler, HTTPError } from "nitro";
import { getQuery } from "nitro/h3";
import { useDb } from "@/server/utils/db";
import { useCloudflareEnv } from "@/server/utils/cloudflare";
import { findCommentMany } from "@/server/operations/comments";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const comicId = query.comicId as string | undefined;

  if (!comicId) {
    throw new HTTPError({ status: 400, message: "comicId query parameter is required." });
  }

  const db = useDb(event);
  const env = useCloudflareEnv(event);
  const currentUserId = event.context.user?.id;

  const comments = await findCommentMany(
    db,
    {
      comicId,
      chapterId: query.chapterId as string | undefined,
      currentUserId,
    },
    env,
  );

  return {
    status: "ok",
    data: comments,
  };
});

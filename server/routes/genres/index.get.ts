import { defineHandler } from "nitro";
import { useDb } from "@/server/utils/db";
import { findGenreMany } from "@/server/operations/genres";

export default defineHandler(async (event) => {
  const db = useDb(event);
  const genres = await findGenreMany(db);

  return {
    status: "ok",
    data: genres,
  };
});

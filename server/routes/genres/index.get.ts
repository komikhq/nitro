import { defineHandler } from "nitro";
import { useDb } from "@/server/utils/db";
import { GenreService } from "@/server/services/genre.service";

export default defineHandler(async (event) => {
  const db = useDb(event);
  const service = new GenreService(db);

  const genres = await service.getAllGenres();

  return {
    status: "ok",
    data: genres,
  };
});

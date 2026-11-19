import { type DbClient } from "@/server/db";
import { type StorageEnv } from "@/server/lib/storage";
import { findComicMany } from "./find-comic-many";

export async function findComicTrending(
  db: DbClient,
  limit: number = 10,
  storageEnv?: Partial<StorageEnv>,
) {
  return findComicMany(
    db,
    {
      sort: "popular",
      page: 1,
      limit,
    },
    storageEnv,
  );
}

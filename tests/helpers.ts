import { openDatabase, useDatabaseForTesting } from "@/server/db/client";

/** Fresh, migrated in-memory database for each test. */
export function useTestDatabase() {
  const db = openDatabase(":memory:");
  useDatabaseForTesting(db);
  return db;
}

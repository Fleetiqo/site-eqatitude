import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../env";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const MIGRATIONS_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle");

/**
 * Opens (or creates) a SQLite database and applies pending migrations.
 * WAL mode lets the site keep reading while the admin console writes.
 */
export function openDatabase(file: string): Db {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema }) as Db;
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db;
}

const globalForDb = globalThis as unknown as { __equattitudDb?: Db };

/**
 * Process-wide connection, opened on first use. Kept on globalThis so hot reload
 * in development does not open a new connection on every change.
 */
export function getDb(): Db {
  globalForDb.__equattitudDb ??= openDatabase(env.paths.database);
  return globalForDb.__equattitudDb;
}

/** Tests: use another database (typically ":memory:") for the rest of the process. */
export function useDatabaseForTesting(db: Db): void {
  globalForDb.__equattitudDb = db;
}

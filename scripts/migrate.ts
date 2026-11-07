/** Applies pending database migrations (they also run automatically when the app starts). */
import "./_env";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";

getDb();
console.log(`Migrations appliquées : ${env.paths.database}`);

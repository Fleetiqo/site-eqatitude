import { desc, lt, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { activityLog } from "../db/schema";
import type { ActivityEntry } from "@/lib/types";

const KEEP = 500;

/** Records a change made from the admin console (shown in "Journal d'activité"). */
export function logActivity(text: string): void {
  const db = getDb();
  db.insert(activityLog)
    .values({ at: new Date().toISOString(), text: text.slice(0, 300) })
    .run();
  // Keep the log bounded: drop everything older than the KEEP most recent entries.
  db.delete(activityLog)
    .where(
      lt(activityLog.id, sql`(SELECT MIN(id) FROM (SELECT id FROM ${activityLog} ORDER BY id DESC LIMIT ${KEEP}))`),
    )
    .run();
}

export const listActivity = (limit = KEEP): ActivityEntry[] =>
  getDb()
    .select({ at: activityLog.at, text: activityLog.text })
    .from(activityLog)
    .orderBy(desc(activityLog.id))
    .limit(limit)
    .all();

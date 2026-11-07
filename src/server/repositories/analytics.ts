import { gte, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { pageViews } from "../db/schema";
import { addDays, today } from "@/lib/format";

const BOT_RE = /bot|crawl|spider|preview|curl|wget|headless|lighthouse|monitor/i;

/** Counts an anonymous page view (no cookie, nothing personal stored). Bots are ignored. */
export function recordPageView(path: string, userAgent: string | null, day = today()): void {
  if (!userAgent || BOT_RE.test(userAgent)) return;
  getDb()
    .insert(pageViews)
    .values({ day, path, views: 1 })
    .onConflictDoUpdate({ target: [pageViews.day, pageViews.path], set: { views: sql`${pageViews.views} + 1` } })
    .run();
}

export interface TrafficStats {
  /** One entry per day, oldest first, including days without visits. */
  days: { day: string; total: number }[];
  /** Views per page over the period, most viewed first. */
  pages: [path: string, views: number][];
}

export function getTraffic(days = 30, end = today()): TrafficStats {
  const start = addDays(end, -(days - 1));
  const rows = getDb().select().from(pageViews).where(gte(pageViews.day, start)).all();
  const perDay = new Map<string, number>();
  const perPage = new Map<string, number>();
  for (const r of rows) {
    perDay.set(r.day, (perDay.get(r.day) ?? 0) + r.views);
    perPage.set(r.path, (perPage.get(r.path) ?? 0) + r.views);
  }
  return {
    days: Array.from({ length: days }, (_, i) => {
      const day = addDays(start, i);
      return { day, total: perDay.get(day) ?? 0 };
    }),
    pages: [...perPage.entries()].sort((a, b) => b[1] - a[1]),
  };
}

import fs from "node:fs";
import path from "node:path";
import { env } from "../env";
import type { Backup } from "./content-transfer";

/** Writes a copy of the current data on the server before a restore (storage/backups/). */
export function writeSafetyBackup(backup: Backup): string {
  fs.mkdirSync(env.paths.backups, { recursive: true });
  const file = path.join(env.paths.backups, `avant-restauration-${backup.createdAt.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(backup));
  return file;
}

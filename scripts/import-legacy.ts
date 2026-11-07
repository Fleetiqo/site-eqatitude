/**
 * Imports the data of the original Express site into the SQLite database:
 *   npm run import:legacy -- "/chemin/vers/ancien-site"
 *
 * Reads data/content.json, quotes.json, messages.json, stats.json, activity.json and admin.json,
 * and copies uploads/site and uploads/devis. Existing content, quotes and messages are replaced.
 */
import "./_env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/server/db/client";
import { activityLog, pageViews } from "@/server/db/schema";
import { env } from "@/server/env";
import { convertLegacyContent, convertLegacyMessage, convertLegacyQuote } from "@/server/legacy/convert";
import { setPasswordHash } from "@/server/repositories/auth";
import { importContent, importRequests } from "@/server/services/content-transfer";

const root = process.argv[2];
if (!root || !fs.existsSync(path.join(root, "data"))) {
  console.error('Usage : npm run import:legacy -- "/chemin/vers/ancien-site"  (dossier contenant data/ et uploads/)');
  process.exit(1);
}

const read = (name: string): unknown => {
  const file = path.join(root, "data", name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : undefined;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const content = read("content.json") ?? read("content.default.json");
if (!content) throw new Error("data/content.json introuvable");
importContent(convertLegacyContent(content));

const quotes = list(read("quotes.json")).map(convertLegacyQuote);
const messages = list(read("messages.json")).map(convertLegacyMessage);
importRequests(quotes, messages);

const stats = (read("stats.json") ?? { days: {} }) as { days?: Record<string, { pages?: Record<string, number> }> };
const activity = list(read("activity.json")) as { at: string; text: string }[];
getDb().transaction((tx) => {
  tx.delete(pageViews).run();
  for (const [day, d] of Object.entries(stats.days ?? {})) {
    for (const [page, views] of Object.entries(d.pages ?? {}))
      tx.insert(pageViews).values({ day, path: page, views }).run();
  }
  tx.delete(activityLog).run();
  // The old log is newest first; insert oldest first so ids follow chronology.
  for (const a of [...activity].reverse()) tx.insert(activityLog).values({ at: a.at, text: a.text }).run();
});

// The password hash format is compatible: the current password keeps working.
const admin = read("admin.json") as { salt?: string; hash?: string } | undefined;
if (admin?.salt && admin.hash) setPasswordHash(`scrypt$${admin.salt}$${admin.hash}`);

let copied = 0;
for (const [from, to] of [
  [path.join(root, "uploads", "site"), env.paths.siteUploads],
  [path.join(root, "uploads", "devis"), env.paths.quoteUploads],
] as const) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    if (f.startsWith(".")) continue;
    fs.copyFileSync(path.join(from, f), path.join(to, f));
    copied++;
  }
}

console.log(
  `Import terminé : ${quotes.length} devis, ${messages.length} message(s), ${copied} fichier(s) copié(s)` +
    `${admin?.hash ? ", mot de passe admin conservé" : ""}.`,
);

"use server";

import { z } from "zod";
import { convertLegacyContent, convertLegacyMessage, convertLegacyQuote } from "../legacy/convert";
import { logActivity } from "../repositories/activity";
import type { QuoteWithRelations } from "../repositories/quotes";
import { exportBackup, importContent, importRequests, type SiteContent } from "../services/content-transfer";
import { writeSafetyBackup } from "../services/backups";
import { adminAction, UserError } from "./run";
import type { ContactMessage } from "@/lib/types";

const quoteSchema = z.looseObject({
  id: z.string().min(1),
  ref: z.string().min(1),
  createdAt: z.string(),
  status: z.string(),
  types: z.array(z.string()),
  contact: z.looseObject({}),
  files: z.array(z.looseObject({})).default([]),
  history: z.array(z.object({ at: z.string(), text: z.string() })).default([]),
});

/**
 * Restores a backup file (current format, or a file downloaded from the previous version).
 * A copy of the current data is written to the server first.
 */
export async function restoreBackup(fileContent: string, includeRequests: boolean) {
  return adminAction(() => {
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(fileContent);
    } catch {
      throw new UserError("Fichier illisible.");
    }
    if (raw?.app !== "equattitud") throw new UserError("Fichier de sauvegarde invalide.");

    const legacy = raw.version === 1;
    const content = (legacy ? convertLegacyContent(raw.content) : raw.content) as SiteContent;
    const quotes = (Array.isArray(raw.quotes) ? raw.quotes : []).map((q) => (legacy ? convertLegacyQuote(q) : q));
    const messages = (Array.isArray(raw.messages) ? raw.messages : []).map((m) =>
      legacy ? convertLegacyMessage(m) : m,
    );

    writeSafetyBackup(exportBackup());
    importContent(content);
    if (includeRequests) {
      importRequests(
        z.array(quoteSchema).parse(quotes) as unknown as QuoteWithRelations[],
        messages as ContactMessage[],
      );
    }
    logActivity("Restauration d'une sauvegarde");
    return null;
  });
}

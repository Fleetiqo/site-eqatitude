import { NextResponse } from "next/server";
import { projectTypeLabel } from "@/lib/quotes/definitions";
import { isEmail, parseQuoteSubmission } from "@/lib/quotes/validation";
import { jsonError, requestIp } from "@/server/http/request";
import { createQuote } from "@/server/repositories/quotes";
import { notifyShop } from "@/server/services/mailer";
import { createRateLimiter } from "@/server/services/rate-limit";
import { QUOTE_FILES_MAX, removeUploads, saveQuoteFile, type StoredFile, UploadError } from "@/server/services/storage";

const allow = createRateLimiter(5, 10 * 60 * 1000);

/** Quote request from the 5-step form: multipart with a JSON "data" part and up to 8 files. */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Données invalides.");

  let raw: unknown;
  try {
    raw = JSON.parse(String(form.get("data") ?? "{}"));
  } catch {
    return jsonError("Données invalides.");
  }
  const parsed = parseQuoteSubmission(raw);
  if (!parsed.ok) return parsed.spam ? NextResponse.json({ ok: true, ref: "—" }) : jsonError(parsed.error);

  const uploads = form.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length > QUOTE_FILES_MAX) return jsonError("Fichiers refusés (8 maximum, images ou PDF).");
  if (!allow(await requestIp()))
    return jsonError("Trop de demandes envoyées. Réessayez dans quelques minutes ou appelez-nous.", 429);

  const files: StoredFile[] = [];
  try {
    for (const file of uploads) files.push(await saveQuoteFile(file));
  } catch (error) {
    await removeUploads(
      "devis",
      files.map((f) => f.storedName),
    );
    if (error instanceof UploadError) return jsonError(error.message);
    throw error;
  }

  const quote = createQuote({
    request: parsed.data,
    status: "nouveau",
    source: "",
    files,
    event: "Demande reçue depuis le site",
  });
  const c = quote.contact;
  await notifyShop(
    `[Site] Demande de devis ${quote.ref} — ${quote.types.map(projectTypeLabel).join(", ")}`,
    [
      `Nouvelle demande de devis ${quote.ref}`,
      "",
      `${c.firstName} ${c.lastName}`.trim(),
      c.email,
      c.phone,
      "",
      `Projet : ${quote.types.map(projectTypeLabel).join(", ")}`,
      `Commune : ${quote.site.city ?? ""}`,
      "",
      "Consultez le détail dans la console d'administration.",
    ].join("\n"),
    isEmail(c.email) ? c.email : undefined,
  );
  return NextResponse.json({ ok: true, ref: quote.ref });
}

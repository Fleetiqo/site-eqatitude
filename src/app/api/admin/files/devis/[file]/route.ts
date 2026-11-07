import fs from "node:fs/promises";
import { requireAdmin } from "@/server/auth/session";
import { findQuoteFile } from "@/server/repositories/quotes";
import { uploadPath } from "@/server/services/storage";

/** Files attached to quote requests are private: served to the logged-in admin only. */
export async function GET(_request: Request, { params }: RouteContext<"/api/admin/files/devis/[file]">) {
  await requireAdmin();
  const { file } = await params;
  const record = findQuoteFile(file);
  const filePath = uploadPath("devis", file);
  if (!record || !filePath) return new Response("Introuvable", { status: 404 });
  try {
    const data = await fs.readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": record.mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(record.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
}

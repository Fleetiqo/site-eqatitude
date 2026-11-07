import { requireAdmin } from "@/server/auth/session";
import { exportBackup } from "@/server/services/content-transfer";

/** Full backup: site content, quotes and messages (photos live in storage/uploads). */
export async function GET() {
  await requireAdmin();
  const backup = exportBackup();
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sauvegarde-equattitud-${backup.createdAt.slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

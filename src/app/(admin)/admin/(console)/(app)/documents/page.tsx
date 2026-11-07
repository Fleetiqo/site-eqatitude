import type { Metadata } from "next";
import { LegalForm } from "@/components/admin/SettingsForms";
import { requireAdmin } from "@/server/auth/session";
import { getSettings } from "@/server/repositories/settings";

export const metadata: Metadata = { title: "Documents de devis" };

export default async function DocumentsPage() {
  await requireAdmin();
  return <LegalForm legal={getSettings().legal} />;
}

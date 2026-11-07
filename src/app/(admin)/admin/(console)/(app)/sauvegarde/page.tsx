import type { Metadata } from "next";
import { BackupPanel } from "@/components/admin/SettingsForms";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sauvegarde" };

export default async function BackupPage() {
  await requireAdmin();
  return <BackupPanel />;
}

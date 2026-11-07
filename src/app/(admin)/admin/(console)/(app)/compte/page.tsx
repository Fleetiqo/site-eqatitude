import type { Metadata } from "next";
import { PasswordForm } from "@/components/admin/SettingsForms";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Compte" };

export default async function AccountPage() {
  await requireAdmin();
  return <PasswordForm />;
}

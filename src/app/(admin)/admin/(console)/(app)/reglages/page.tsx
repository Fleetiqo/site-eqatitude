import type { Metadata } from "next";
import { ShopSettingsForm } from "@/components/admin/SettingsForms";
import { requireAdmin } from "@/server/auth/session";
import { getOpeningHours } from "@/server/repositories/content";
import { getSettings } from "@/server/repositories/settings";

export const metadata: Metadata = { title: "Infos & horaires" };

export default async function SettingsPage() {
  await requireAdmin();
  return <ShopSettingsForm settings={getSettings()} hours={getOpeningHours()} />;
}

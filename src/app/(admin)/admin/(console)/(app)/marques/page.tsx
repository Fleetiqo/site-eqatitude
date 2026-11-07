import type { Metadata } from "next";
import { BrandsForm } from "@/components/admin/SettingsForms";
import { requireAdmin } from "@/server/auth/session";
import { getBrands } from "@/server/repositories/content";

export const metadata: Metadata = { title: "Marques" };

export default async function BrandsPage() {
  await requireAdmin();
  return <BrandsForm brands={getBrands()} />;
}

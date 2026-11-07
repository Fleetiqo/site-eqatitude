import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/server/auth/session";
import { loadCounters } from "@/server/queries/admin";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell counters={loadCounters()}>{children}</AdminShell>;
}

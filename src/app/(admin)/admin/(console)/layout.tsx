import type { ReactNode } from "react";
import { AdminUiProvider } from "@/components/admin/AdminUi";
import "@/styles/admin.css";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <AdminUiProvider>{children}</AdminUiProvider>;
}

import type { Metadata } from "next";
import { ClientsTable } from "@/components/admin/ClientsTable";
import { requireAdmin } from "@/server/auth/session";
import { buildClients, loadMessages, loadQuotes } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireAdmin();
  return (
    <>
      <div className="head-row">
        <h1>Clients</h1>
        <a className="btn btn--ghost" href="/api/admin/export/clients" download>
          Exporter (Excel)
        </a>
      </div>
      <p className="muted">Fichier constitué automatiquement à partir des demandes de devis et des messages.</p>
      <ClientsTable clients={buildClients(loadQuotes(), loadMessages())} />
    </>
  );
}

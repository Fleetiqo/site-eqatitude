import type { Metadata } from "next";
import Link from "next/link";
import { NewQuoteForm } from "@/components/admin/NewQuoteForm";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Nouvelle demande" };

export default async function NewQuotePage() {
  await requireAdmin();
  return (
    <>
      <p>
        <Link href="/admin/devis">← Toutes les demandes</Link>
      </p>
      <h1>Nouvelle demande de devis</h1>
      <p className="muted">Pour une demande reçue par téléphone ou au magasin.</p>
      <NewQuoteForm />
    </>
  );
}

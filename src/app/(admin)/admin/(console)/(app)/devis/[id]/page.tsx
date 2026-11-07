import type { Metadata } from "next";
import Link from "next/link";
import { QuoteDetail } from "@/components/admin/QuoteDetail";
import { requireAdmin } from "@/server/auth/session";
import { getQuote } from "@/server/repositories/quotes";
import { getSettings } from "@/server/repositories/settings";

export async function generateMetadata({ params }: PageProps<"/admin/devis/[id]">): Promise<Metadata> {
  const quote = getQuote((await params).id);
  return { title: quote?.ref ?? "Demande introuvable" };
}

export default async function QuotePage({ params }: PageProps<"/admin/devis/[id]">) {
  await requireAdmin();
  const quote = getQuote((await params).id);
  if (!quote) {
    return (
      <p>
        Demande introuvable. <Link href="/admin/devis">Retour</Link>
      </p>
    );
  }
  const { legal, business } = getSettings();
  return <QuoteDetail quote={quote} legal={legal} business={business} />;
}

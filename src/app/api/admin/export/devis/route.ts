import { formatFrenchNumber } from "@/lib/format";
import { projectTypeShortLabel, QUOTE_STATUSES } from "@/lib/quotes/definitions";
import { requireAdmin } from "@/server/auth/session";
import { csvResponse, toCsv } from "@/server/http/csv";
import { quoteTotal } from "@/server/queries/admin";
import { listQuotes } from "@/server/repositories/quotes";

export async function GET() {
  await requireAdmin();
  const header = [
    "Référence",
    "Date",
    "Statut",
    "Nom",
    "Prénom",
    "Téléphone",
    "E-mail",
    "Commune",
    "Projet",
    "Délai",
    "Budget",
    "Prestation",
    "Montant TTC",
    "Relance",
  ];
  const rows = listQuotes().map((q) => {
    const total = quoteTotal(q);
    return [
      q.ref,
      q.createdAt.slice(0, 10),
      QUOTE_STATUSES[q.status],
      q.contact.lastName,
      q.contact.firstName,
      q.contact.phone,
      q.contact.email,
      String(q.site.city ?? ""),
      q.types.map(projectTypeShortLabel).join(" + "),
      String(q.site.timeline ?? ""),
      String(q.site.budget ?? ""),
      String(q.site.service ?? ""),
      total === null ? "" : formatFrenchNumber(total),
      q.reminderDate,
    ];
  });
  return csvResponse(toCsv([header, ...rows]), "devis-equattitud.csv");
}

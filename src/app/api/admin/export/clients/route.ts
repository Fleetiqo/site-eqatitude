import { formatFrenchNumber } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { csvResponse, toCsv } from "@/server/http/csv";
import { buildClients } from "@/server/queries/admin";
import { listMessages } from "@/server/repositories/messages";
import { listQuotes } from "@/server/repositories/quotes";

export async function GET() {
  await requireAdmin();
  const header = [
    "Nom",
    "Prénom",
    "Structure",
    "Téléphone",
    "E-mail",
    "Commune",
    "Nb devis",
    "Montant accepté TTC",
    "Dernier contact",
  ];
  const rows = buildClients(listQuotes(), listMessages()).map((c) => [
    c.lastName,
    c.firstName,
    c.organization,
    c.phone,
    c.email,
    c.city,
    c.quotes.length,
    c.acceptedAmount ? formatFrenchNumber(c.acceptedAmount) : "",
    c.lastContact.slice(0, 10),
  ]);
  return csvResponse(toCsv([header, ...rows]), "clients-equattitud.csv");
}

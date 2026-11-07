/** Quote pricing ("chiffrage"): line items, discount and VAT. Amounts are excluding tax (HT) unless stated. */

export interface PricingSection {
  kind: "section";
  label: string;
}

export interface PricingItem {
  kind: "item";
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export type PricingLine = PricingSection | PricingItem;

export interface QuotePricing {
  subject: string;
  lines: PricingLine[];
  discountPercent: number;
  vatRate: number;
  validityDays: number;
  conditions: string;
  /** Issue date "YYYY-MM-DD". */
  date: string;
}

export interface QuoteTotals {
  /** Sum of line totals. */
  subtotal: number;
  discount: number;
  /** Subtotal after discount, the VAT base. */
  net: number;
  vat: number;
  total: number;
}

export const VAT_RATES = [20, 10, 5.5, 0] as const;
export const PRICING_UNITS = ["u", "m", "ml", "m²", "h", "forfait", "lot", "rouleau"] as const;

/** Product names suggested while typing a line label. */
export const PRICING_SUGGESTIONS = [
  "Poteau bois",
  "Poteau acacia",
  "Lisse bois",
  "Lisse PVC",
  "Ruban électrique",
  "Fil / cordelette électrique",
  "Isolateurs",
  "Électrificateur",
  "Piquet de terre",
  "Barrière galvanisée",
  "Portail",
  "Passage d'homme",
  "Façade de box",
  "Séparation de box",
  "Porte coulissante",
  "Mangeoire",
  "Abreuvoir automatique",
  "Abri de prairie",
  "Dalles alvéolées",
  "Stabilisateur drainant",
  "Sable de carrière",
  "Main d'œuvre — pose",
  "Livraison",
  "Déplacement",
];

export const lineTotal = (line: PricingLine): number =>
  line.kind === "item" ? (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0) : 0;

/** Rounds to the cent to avoid floating point drift in displayed totals. */
const cents = (n: number): number => Math.round(n * 100) / 100;

export function computeTotals(pricing: Pick<QuotePricing, "lines" | "discountPercent" | "vatRate">): QuoteTotals {
  const subtotal = pricing.lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const discount = subtotal * ((Number(pricing.discountPercent) || 0) / 100);
  const net = subtotal - discount;
  const vat = net * ((Number(pricing.vatRate) || 0) / 100);
  return {
    subtotal: cents(subtotal),
    discount: cents(discount),
    net: cents(net),
    vat: cents(vat),
    total: cents(net + vat),
  };
}

export const hasPricedLines = (pricing: QuotePricing | null | undefined): pricing is QuotePricing =>
  !!pricing && pricing.lines.some((l) => l.kind === "item");

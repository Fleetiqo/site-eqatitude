import { describe, expect, it } from "vitest";
import { computeTotals, hasPricedLines, type QuotePricing } from "@/lib/quotes/pricing";

const DEMO: QuotePricing = {
  subject: "Démo",
  discountPercent: 5,
  vatRate: 20,
  validityDays: 30,
  conditions: "",
  date: "2026-11-04",
  lines: [
    { kind: "section", label: "Clôture" },
    { kind: "item", label: "Poteau", quantity: 160, unit: "u", unitPrice: 14.5 },
    { kind: "item", label: "Lisse", quantity: 300, unit: "u", unitPrice: 9.9 },
    { kind: "item", label: "Visserie", quantity: 1, unit: "lot", unitPrice: 145 },
    { kind: "item", label: "Barrière", quantity: 1, unit: "u", unitPrice: 289 },
    { kind: "item", label: "Poteaux de portail", quantity: 1, unit: "lot", unitPrice: 118 },
    { kind: "item", label: "Dalles", quantity: 40, unit: "m²", unitPrice: 16.9 },
    { kind: "item", label: "Pose", quantity: 28, unit: "h", unitPrice: 42 },
    { kind: "item", label: "Livraison", quantity: 1, unit: "forfait", unitPrice: 85 },
  ],
};

describe("quote pricing", () => {
  it("matches the total of the demo quote of the original site (8 868,06 € TTC)", () => {
    const t = computeTotals(DEMO);
    expect(t.subtotal).toBe(7779);
    expect(t.discount).toBe(388.95);
    expect(t.net).toBe(7390.05);
    expect(t.vat).toBe(1478.01);
    expect(t.total).toBe(8868.06);
  });

  it("ignores section titles", () => {
    expect(hasPricedLines({ ...DEMO, lines: [{ kind: "section", label: "x" }] })).toBe(false);
    expect(computeTotals({ lines: [{ kind: "section", label: "x" }], discountPercent: 0, vatRate: 20 }).total).toBe(0);
  });
});

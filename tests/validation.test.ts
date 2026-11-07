import { describe, expect, it } from "vitest";
import { parseQuoteSubmission } from "@/lib/quotes/validation";

const valid = {
  types: ["cloture", "inconnu"],
  details: { cloture: { length: "400", fenceType: "Lisses bois", hacked: "<x>" }, box: { count: "3" } },
  projectNotes: "  Prairie de 1 ha  ",
  site: { city: "Quimper", postalCode: "29000", animals: ["Chevaux", "Licornes"] },
  contact: { lastName: "Martin", email: "a@b.fr", phone: "" },
  consent: true,
  website: "",
};

describe("quote request validation", () => {
  it("keeps only declared fields and selected project types", () => {
    const r = parseQuoteSubmission(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.types).toEqual(["cloture"]);
    expect(r.data.details).toEqual({ cloture: { length: "400", fenceType: "Lisses bois" } });
    expect(r.data.site.animals).toEqual(["Chevaux"]);
    expect(r.data.projectNotes).toBe("Prairie de 1 ha");
    expect(r.data.contact.lastName).toBe("Martin");
  });

  it("requires a name, a way to answer and consent", () => {
    expect(parseQuoteSubmission({ ...valid, consent: false }).ok).toBe(false);
    expect(parseQuoteSubmission({ ...valid, contact: { lastName: "Martin", email: "pas-un-email" } }).ok).toBe(false);
    expect(parseQuoteSubmission({ ...valid, types: [] })).toEqual({
      ok: false,
      error: "Choisissez au moins un type de projet.",
    });
  });

  it("flags the honeypot as spam", () => {
    expect(parseQuoteSubmission({ ...valid, website: "http://spam" })).toMatchObject({ ok: false, spam: true });
  });
});

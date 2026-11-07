import { describe, expect, it } from "vitest";
import { convertLegacyContent, convertLegacyQuote } from "@/server/legacy/convert";

describe("import from the original Express version", () => {
  it("converts a quote with French keys to the current model", () => {
    const q = convertLegacyQuote({
      id: "abc",
      ref: "DEV-2026-0001",
      createdAt: "2026-11-04T09:00:00.000Z",
      status: "envoye",
      notes: "interne",
      rappel: "2026-11-11",
      types: ["cloture", "box"],
      details: {
        precisions: "Texte",
        cloture: { type: "Lisses bois", longueur: "400" },
        box: { options: ["Mangeoire"] },
      },
      chantier: { commune: "Quimper", codePostal: "29000", animaux: ["Chevaux"], nbAnimaux: "3" },
      contact: { nom: "Martin", prenom: "Anne", telephone: "06", email: "a@b.fr", profil: "Particulier" },
      files: [{ name: "plan.pdf", file: "1-x.pdf", size: 10, type: "application/pdf" }],
      history: [{ at: "2026-11-04T09:00:00.000Z", text: "Reçue" }],
      chiffrage: {
        objet: "Clôture",
        lignes: [
          { section: true, designation: "A" },
          { designation: "Poteau", qte: 2, unite: "u", pu: 10 },
        ],
        remise: 0,
        tva: 20,
        validite: 30,
      },
    });
    expect(q.details).toEqual({
      cloture: { fenceType: "Lisses bois", length: "400" },
      box: { equipment: ["Mangeoire"] },
    });
    expect(q.site).toEqual({ city: "Quimper", postalCode: "29000", animals: ["Chevaux"], animalCount: "3" });
    expect(q.contact).toMatchObject({ lastName: "Martin", firstName: "Anne", phone: "06", profile: "Particulier" });
    expect(q.projectNotes).toBe("Texte");
    expect(q.reminderDate).toBe("2026-11-11");
    expect(q.pricing?.lines).toEqual([
      { kind: "section", label: "A" },
      { kind: "item", label: "Poteau", quantity: 2, unit: "u", unitPrice: 10 },
    ]);
    expect(q.files[0]).toMatchObject({ originalName: "plan.pdf", storedName: "1-x.pdf" });
  });

  it("maps the editable page texts to content blocks, skipping unchanged ones", () => {
    const c = convertLegacyContent({
      settings: { name: "X", google: { enabled: true, note: "4,3", nbAvis: 99, url: "u" } },
      hours: [],
      pages: { intro: "Texte modifié", homeEquitationImg: "/img/selle-4.jpg" },
      occasions: [{ id: "o", title: "Selle", marque: "M", statut: "reserve" }],
      avis: [{ id: "a", auteur: "B", texte: "Super", note: "" }],
    });
    expect(c.blocks).toEqual({ "home.intro.text": "Texte modifié" });
    expect(c.settings.google).toEqual({ enabled: true, note: "4,3", reviewCount: 99, url: "u" });
    expect(c.usedItems[0]).toMatchObject({ brand: "M", status: "reserve" });
    expect(c.reviews[0]).toMatchObject({ author: "B", rating: null, published: true });
  });
});

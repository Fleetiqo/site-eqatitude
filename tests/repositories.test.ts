import { beforeEach, describe, expect, it } from "vitest";
import defaultContent from "@/server/db/default-content.json";
import { BLOCKS } from "@/content/blocks";
import { verifyPassword, hashPassword } from "@/server/auth/password";
import {
  clearFailures,
  createSession,
  isLocked,
  recordFailure,
  touchSession,
  SESSION_IDLE_MS,
} from "@/server/repositories/auth";
import { listActivity, logActivity } from "@/server/repositories/activity";
import { getTraffic, recordPageView } from "@/server/repositories/analytics";
import { listCards, listGallery, listPublishedNews, saveNews } from "@/server/repositories/catalog";
import { getBlockOverrides, getTexts, saveBlocks } from "@/server/repositories/content";
import { createQuote, deleteQuote, getQuote, updateQuote } from "@/server/repositories/quotes";
import { exportContent, importContent, isEmptyDatabase, type SiteContent } from "@/server/services/content-transfer";
import { replaceImageEverywhere } from "@/server/services/media";
import { EMPTY_CONTACT, type QuoteRequestData } from "@/lib/quotes/definitions";
import { useTestDatabase } from "./helpers";

const request: QuoteRequestData = {
  types: ["cloture"],
  details: {},
  projectNotes: "",
  site: { city: "Quimper" },
  contact: { ...EMPTY_CONTACT, lastName: "Martin" },
};

beforeEach(() => {
  useTestDatabase();
});

describe("quotes", () => {
  it("numbers references per year and never reuses a deleted number", () => {
    const now = new Date("2026-05-01T10:00:00Z");
    const a = createQuote({ request, status: "nouveau", source: "", event: "Reçue" }, now);
    const b = createQuote({ request, status: "nouveau", source: "", event: "Reçue" }, now);
    expect([a.ref, b.ref]).toEqual(["DEV-2026-0001", "DEV-2026-0002"]);
    deleteQuote(b.id);
    // Deleting the latest quote must not free its number.
    expect(createQuote({ request, status: "nouveau", source: "", event: "Reçue" }, now).ref).toBe("DEV-2026-0003");
    expect(
      createQuote({ request, status: "nouveau", source: "", event: "Reçue" }, new Date("2027-01-02T10:00:00Z")).ref,
    ).toBe("DEV-2027-0001");
  });

  it("records history events with each change and cascades on delete", () => {
    const q = createQuote({
      request,
      status: "nouveau",
      source: "",
      event: "Reçue",
      files: [{ originalName: "plan.pdf", storedName: "1-abc.pdf", size: 10, mimeType: "application/pdf" }],
    });
    updateQuote(q.id, { status: "envoye" }, ["Statut : Devis envoyé"], new Date(Date.now() + 1000));
    const full = getQuote(q.id);
    expect(full?.status).toBe("envoye");
    expect(full?.history.map((h) => h.text)).toEqual(["Statut : Devis envoyé", "Reçue"]);
    expect(deleteQuote(q.id)).toEqual({ ref: q.ref, storedFiles: ["1-abc.pdf"] });
    expect(getQuote(q.id)).toBeNull();
  });
});

describe("content", () => {
  it("seeds the default content and exports it back unchanged", () => {
    expect(isEmptyDatabase()).toBe(true);
    importContent(defaultContent as SiteContent);
    expect(isEmptyDatabase()).toBe(false);
    const out = exportContent();
    expect(out.departments).toEqual(defaultContent.departments);
    expect(out.gallery).toEqual(defaultContent.gallery);
    expect(out.hours).toEqual(defaultContent.hours);
  });

  it("stores only the texts that differ from the defaults", () => {
    saveBlocks({ "home.intro.title": "Nouveau titre", "home.cta.button": BLOCKS["home.cta.button"].default });
    expect(getBlockOverrides()).toEqual({ "home.intro.title": "Nouveau titre" });
    expect(getTexts()["home.cta.button"]).toBe("Demander un devis");
    saveBlocks({ "home.intro.title": BLOCKS["home.intro.title"].default });
    expect(getBlockOverrides()).toEqual({});
  });

  it("hides unpublished and scheduled news", () => {
    saveNews({
      title: "Publiée",
      text: "",
      image: "",
      universe: "equitation",
      publishDate: "2026-01-01",
      published: true,
      featured: false,
    });
    saveNews({
      title: "Brouillon",
      text: "",
      image: "",
      universe: "equitation",
      publishDate: "2026-01-01",
      published: false,
      featured: false,
    });
    saveNews({
      title: "Programmée",
      text: "",
      image: "",
      universe: "equitation",
      publishDate: "2026-12-31",
      published: true,
      featured: false,
    });
    saveNews({
      title: "En avant",
      text: "",
      image: "",
      universe: "amenagement",
      publishDate: "2025-01-01",
      published: true,
      featured: true,
    });
    expect(listPublishedNews("2026-06-01").map((n) => n.title)).toEqual(["En avant", "Publiée"]);
  });

  it("replaces an image everywhere it is used", () => {
    importContent(defaultContent as SiteContent);
    const old = "/img/carriere.jpg"; // home page block default + a fitting offer + a gallery photo
    const count = replaceImageEverywhere(old, "/uploads/site/new.jpg");
    expect(count).toBeGreaterThanOrEqual(2);
    expect(getTexts()["home.amenagement.image"]).toBe("/uploads/site/new.jpg");
    expect(listCards("fittingOffers").some((c) => c.image === old)).toBe(false);
    expect(listGallery().some((g) => g.src === old)).toBe(false);
  });
});

describe("authentication", () => {
  it("verifies passwords, including hashes imported from the original site", async () => {
    const hash = await hashPassword("cheval-2026");
    expect(await verifyPassword("cheval-2026", hash)).toBe(true);
    expect(await verifyPassword("mauvais", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
  });

  it("expires idle sessions", () => {
    const now = Date.now();
    const token = createSession(now);
    expect(touchSession(token, now + 1000)).toBe(true);
    expect(touchSession(token, now + SESSION_IDLE_MS * 2)).toBe(false);
    expect(touchSession("forged", now)).toBe(false);
  });

  it("locks login after 5 failures", () => {
    for (let i = 0; i < 4; i++) recordFailure("ip", 0);
    expect(isLocked("ip", 1)).toBe(false);
    recordFailure("ip", 0);
    expect(isLocked("ip", 1)).toBe(true);
    clearFailures("ip");
    expect(isLocked("ip", 1)).toBe(false);
  });
});

describe("analytics & activity", () => {
  it("counts human page views per day and ignores bots", () => {
    recordPageView("/", "Mozilla/5.0", "2026-11-04");
    recordPageView("/", "Mozilla/5.0", "2026-11-04");
    recordPageView("/devis", "Googlebot/2.1", "2026-11-04");
    const t = getTraffic(2, "2026-11-04");
    expect(t.days).toEqual([
      { day: "2026-11-03", total: 0 },
      { day: "2026-11-04", total: 2 },
    ]);
    expect(t.pages).toEqual([["/", 2]]);
  });

  it("keeps the activity log newest first", () => {
    logActivity("un");
    logActivity("deux");
    expect(listActivity().map((a) => a.text)).toEqual(["deux", "un"]);
  });
});

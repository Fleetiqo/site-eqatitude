import { cache } from "react";
import { after } from "next/server";
import { headers } from "next/headers";
import {
  listAvailableUsedItems,
  listCards,
  listGallery,
  listPublishedNews,
  listPublishedReviews,
} from "../repositories/catalog";
import { getBrands, getClosures, getOpeningHours, getTexts } from "../repositories/content";
import { getSettings } from "../repositories/settings";
import { recordPageView } from "../repositories/analytics";
import { upcomingClosures } from "@/lib/hours";
import { today } from "@/lib/format";
import type { Announcement, Universe } from "@/lib/types";
import type { RichTextContext } from "@/lib/rich-text";

/**
 * Read models for the public pages. Wrapped in React `cache` so the layout and the page
 * share one query per request.
 */

export const loadSettings = cache(getSettings);
export const loadTexts = cache(getTexts);
export const loadHours = cache(getOpeningHours);
export const loadClosures = cache(() => upcomingClosures(getClosures(), today()));
export const loadNews = cache(() => listPublishedNews(today()));
export const loadDepartments = cache(() => listCards("departments"));
export const loadFittingOffers = cache(() => listCards("fittingOffers"));
export const loadServices = cache(() => listCards("services"));
export const loadGallery = cache((universe: Universe) => listGallery(universe));
export const loadUsedItems = cache(listAvailableUsedItems);
export const loadReviews = cache(listPublishedReviews);
export const loadBrands = cache(getBrands);

/** The banner is shown only when enabled and within its optional date range. */
export function activeAnnouncement(a: Announcement, day = today()): string {
  if (!a.enabled || !a.text) return "";
  if ((a.from && a.from > day) || (a.to && a.to < day)) return "";
  return a.text;
}

export const loadRichTextContext = cache((): RichTextContext => {
  const { phone, phoneIntl, email } = loadSettings().business;
  return { phone, phoneIntl, email };
});

/** Counts the view after the response is sent, so it never slows the page down. */
export async function trackPageView(path: string): Promise<void> {
  const userAgent = (await headers()).get("user-agent");
  after(() => {
    try {
      recordPageView(path, userAgent);
    } catch (error) {
      console.error("[stats]", error);
    }
  });
}

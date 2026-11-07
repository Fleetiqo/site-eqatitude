import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { departments, fittingOffers, galleryPhotos, news, services, usedItems } from "../db/schema";
import { env } from "../env";
import { getTexts, saveBlocks } from "../repositories/content";
import { SITE_UPLOAD_PREFIX } from "./storage";
import { BLOCK_KEYS, BLOCK_PAGES, BLOCKS, type BlockKey } from "@/content/blocks";

const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const BUNDLED_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "img");

export interface MediaFile {
  url: string;
  /** Uploaded from the console (can be deleted) vs. delivered with the site. */
  uploaded: boolean;
  modifiedAt: number;
}

function scan(dir: string, prefix: string, uploaded: boolean): MediaFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_RE.test(f))
    .map((f) => ({ url: prefix + f, uploaded, modifiedAt: fs.statSync(path.join(dir, f)).mtimeMs }));
}

/** Every image available to the site, most recent first. */
export function listMedia(): MediaFile[] {
  return [...scan(env.paths.siteUploads, SITE_UPLOAD_PREFIX, true), ...scan(BUNDLED_DIR, "/img/", false)].sort(
    (a, b) => b.modifiedAt - a.modifiedAt,
  );
}

export interface MediaUsage {
  label: string;
  /** Admin page where the usage can be edited. */
  href: string;
}

const imageBlocks = (): BlockKey[] => BLOCK_KEYS.filter((k) => BLOCKS[k].kind === "image");

/** Where each image is used, keyed by URL. */
export function mediaUsages(): Map<string, MediaUsage[]> {
  const db = getDb();
  const usages = new Map<string, MediaUsage[]>();
  const add = (url: string, usage: MediaUsage) => {
    if (!url) return;
    usages.set(url, [...(usages.get(url) ?? []), usage]);
  };

  const texts = getTexts();
  for (const key of imageBlocks()) {
    const def = BLOCKS[key];
    add(texts[key], { label: `${BLOCK_PAGES[def.page].label} — ${def.label}`, href: `/admin/pages?page=${def.page}` });
  }
  for (const r of db.select().from(departments).all())
    add(r.image, { label: `Rayon « ${r.title} »`, href: "/admin/contenu/rayons" });
  for (const r of db.select().from(fittingOffers).all())
    add(r.image, { label: `Offre « ${r.title} »`, href: "/admin/contenu/amenagements" });
  for (const r of db.select().from(services).all())
    add(r.image, { label: `Service « ${r.title} »`, href: "/admin/contenu/services" });
  for (const r of db.select().from(news).all())
    add(r.image, { label: `Nouveauté « ${r.title} »`, href: "/admin/contenu/nouveautes" });
  for (const r of db.select().from(usedItems).all())
    add(r.image, { label: `Occasion « ${r.title} »`, href: "/admin/contenu/occasions" });
  for (const r of db.select().from(galleryPhotos).all())
    add(r.src, {
      label: `Galerie ${r.universe === "equitation" ? "Équitation" : "Aménagement"}`,
      href: "/admin/galerie",
    });
  return usages;
}

/** Replaces an image everywhere it is used on the site. Returns the number of places updated. */
export function replaceImageEverywhere(oldUrl: string, newUrl: string): number {
  if (!oldUrl || !newUrl || oldUrl === newUrl) return 0;
  const db = getDb();
  let count = 0;

  const texts = getTexts();
  const blocks = Object.fromEntries(
    imageBlocks()
      .filter((k) => texts[k] === oldUrl)
      .map((k) => [k, newUrl]),
  );
  saveBlocks(blocks);
  count += Object.keys(blocks).length;

  db.transaction((tx) => {
    for (const t of [departments, fittingOffers, services, news, usedItems]) {
      count += tx.update(t).set({ image: newUrl }).where(eq(t.image, oldUrl)).run().changes;
    }
    count += tx.update(galleryPhotos).set({ src: newUrl }).where(eq(galleryPhotos.src, oldUrl)).run().changes;
  });
  return count;
}

/** Deletes an uploaded image file. Bundled images (/img/…) are part of the code and cannot be deleted. */
export function deleteUploadedImage(url: string): boolean {
  if (!url.startsWith(SITE_UPLOAD_PREFIX)) return false;
  const name = path.basename(url);
  fs.rmSync(path.join(env.paths.siteUploads, name), { force: true });
  return true;
}

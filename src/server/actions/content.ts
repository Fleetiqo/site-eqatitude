"use server";

import { z } from "zod";
import { BLOCKS, isBlockKey, type BlockKey } from "@/content/blocks";
import { COLLECTIONS, isCollectionSlug, type CollectionSlug, type ItemValues } from "@/lib/admin-collections";
import { isValidSlots } from "@/lib/hours";
import { SERVER_COLLECTIONS } from "../collections";
import { logActivity } from "../repositories/activity";
import { addGalleryPhotos, deleteGalleryPhoto, reorderGallery, updateGalleryPhoto } from "../repositories/catalog";
import { resetBlocks, saveBlocks, saveBrands as storeBrands, saveOpeningHours } from "../repositories/content";
import { DEFAULT_SETTINGS, saveSettings } from "../repositories/settings";
import { deleteUploadedImage, listMedia, mediaUsages, replaceImageEverywhere } from "../services/media";
import { saveSiteImage } from "../services/storage";
import { adminAction, UserError } from "./run";

// --- Generic collections (news, used items, reviews, closures, cards) ---------

function collection(slug: string): CollectionSlug {
  if (!isCollectionSlug(slug)) throw new UserError("Rubrique inconnue.");
  return slug;
}

const itemValues = z.record(z.string(), z.union([z.string(), z.boolean()]));

export async function saveItem(slug: string, values: ItemValues, id?: string) {
  return adminAction(() => {
    const c = collection(slug);
    const label = SERVER_COLLECTIONS[c].save(itemValues.parse(values), id);
    const singular = COLLECTIONS[c].singular;
    logActivity(`${id ? "Modification" : "Ajout"} — ${singular} : ${label}`);
    return null;
  });
}

export async function deleteItem(slug: string, id: string, label: string) {
  return adminAction(() => {
    const c = collection(slug);
    SERVER_COLLECTIONS[c].remove(id);
    logActivity(`Suppression — ${COLLECTIONS[c].singular} : ${label}`);
    return null;
  });
}

export async function reorderItems(slug: string, ids: string[]) {
  return adminAction(() => {
    const c = collection(slug);
    SERVER_COLLECTIONS[c].reorder?.(z.array(z.string()).parse(ids));
    logActivity(`Réorganisation : ${COLLECTIONS[c].title}`);
    return null;
  });
}

// --- Gallery ------------------------------------------------------------------

const universe = z.enum(["equitation", "amenagement"]);
const imageUrl = z.string().regex(/^\/(img|uploads\/site)\/[\w.\-]+$/, "Image invalide.");

export async function addToGallery(urls: string[], to: string) {
  return adminAction(() => {
    addGalleryPhotos(z.array(imageUrl).parse(urls), universe.parse(to));
    logActivity(`Ajout — galerie : ${urls.length} photo(s)`);
    return null;
  });
}

export async function updateGallery(id: string, patch: { caption?: string; universe?: string }) {
  return adminAction(() => {
    updateGalleryPhoto(
      id,
      z.object({ caption: z.string().trim().max(200).optional(), universe: universe.optional() }).parse(patch),
    );
    return null;
  });
}

export async function removeFromGallery(id: string) {
  return adminAction(() => {
    deleteGalleryPhoto(id);
    logActivity("Suppression — photo de galerie");
    return null;
  });
}

export async function reorderGalleryPhotos(ids: string[]) {
  return adminAction(() => {
    reorderGallery(z.array(z.string()).parse(ids));
    return null;
  });
}

// --- Media library -------------------------------------------------------------

/** Upload from the console (images are resized in the browser first). */
export async function uploadImage(form: FormData) {
  return adminAction(async () => {
    const file = form.get("image");
    if (!(file instanceof File) || !file.size) throw new UserError("Aucune image reçue.");
    const url = await saveSiteImage(file);
    logActivity("Téléversement d'une image");
    return url;
  });
}

export async function getMediaLibrary() {
  return adminAction(() => {
    const usages = mediaUsages();
    return listMedia().map((m) => ({ ...m, usages: usages.get(m.url) ?? [] }));
  });
}

export async function deleteMedia(url: string) {
  return adminAction(() => {
    if (!deleteUploadedImage(url))
      throw new UserError("Seules les images ajoutées depuis la console peuvent être supprimées.");
    logActivity("Suppression d'une image de la médiathèque");
    return null;
  });
}

export async function replaceMedia(oldUrl: string, newUrl: string) {
  return adminAction(() => {
    const count = replaceImageEverywhere(imageUrl.parse(oldUrl), imageUrl.parse(newUrl));
    logActivity(`Remplacement d'une image (${count} emplacement(s))`);
    return count;
  });
}

// --- Pages, texts & visuals -----------------------------------------------------

export async function savePageBlocks(values: Record<string, string>) {
  return adminAction(() => {
    const clean: Partial<Record<BlockKey, string>> = {};
    for (const [key, value] of Object.entries(values)) {
      if (!isBlockKey(key)) continue;
      const v = String(value).replace(/\r\n/g, "\n").trim().slice(0, 5000);
      if (BLOCKS[key].kind === "image" && v && !imageUrl.safeParse(v).success)
        throw new UserError(`Image invalide : ${BLOCKS[key].label}`);
      clean[key] = v;
    }
    saveBlocks(clean);
    logActivity("Modification — Pages & visuels");
    return null;
  });
}

export async function resetPageBlocks(keys: string[]) {
  return adminAction(() => {
    resetBlocks(keys.filter(isBlockKey));
    logActivity("Pages & visuels : textes d'origine rétablis");
    return null;
  });
}

export async function saveBrands(names: string[]) {
  return adminAction(() => {
    storeBrands(z.array(z.string().trim().max(80)).max(200).parse(names).filter(Boolean));
    logActivity("Modification — Marques");
    return null;
  });
}

// --- Settings ---------------------------------------------------------------

const str = (max = 300) => z.string().trim().max(max);

const shopSettingsSchema = z.object({
  business: z.object({
    name: str(120).min(1, "Le nom de l'enseigne est obligatoire."),
    tagline: str(),
    phone: str(40),
    phoneIntl: str(20).regex(/^\+?[0-9]*$/, "Téléphone international : chiffres uniquement, ex. +33298530177."),
    email: z.union([z.literal(""), z.email("E-mail invalide.")]),
    address: str(),
    city: str(),
    facebook: str(),
    instagram: str(),
    mapQuery: str(),
  }),
  announcement: z.object({ enabled: z.boolean(), text: str(), from: z.string(), to: z.string() }),
  google: z.object({ enabled: z.boolean(), note: str(10), reviewCount: z.coerce.number().int().min(0), url: str(500) }),
  hours: z
    .array(z.object({ day: str(20), slots: str(100) }))
    .length(7)
    .refine((h) => h.every((d) => isValidSlots(d.slots)), "Horaire mal écrit (format : 09:00-12:30, 14:00-19:00)."),
});

export async function saveShopSettings(input: z.input<typeof shopSettingsSchema>) {
  return adminAction(() => {
    const s = shopSettingsSchema.parse(input);
    saveSettings("business", { ...DEFAULT_SETTINGS.business, ...s.business });
    saveSettings("announcement", s.announcement);
    saveSettings("google", s.google);
    saveOpeningHours(s.hours);
    logActivity("Modification — Infos & horaires");
    return null;
  });
}

const legalSchema = z.object({
  companyName: str(200),
  legalForm: str(200),
  siret: str(40),
  vatNumber: str(40),
  defaultVatRate: z.coerce.number().min(0).max(100),
  quoteValidityDays: z.coerce.number().int().min(1).max(365),
  quoteConditions: str(5000),
});

export async function saveLegal(input: z.input<typeof legalSchema>) {
  return adminAction(() => {
    saveSettings("legal", legalSchema.parse(input));
    logActivity("Modification — Documents de devis");
    return null;
  });
}

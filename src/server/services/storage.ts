import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../env";
import { newId } from "../ids";

export const SITE_UPLOAD_PREFIX = "/uploads/site/";

const MB = 1024 * 1024;
export const SITE_IMAGE_MAX_BYTES = 12 * MB;
export const QUOTE_FILE_MAX_BYTES = 10 * MB;
export const QUOTE_FILES_MAX = 8;

type Kind = "jpg" | "png" | "webp" | "gif" | "pdf";

const MIME: Record<Kind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

/** Detects the real file type from its first bytes; the browser-provided type is not trusted. */
export function sniff(bytes: Uint8Array): Kind | null {
  const b = (i: number) => bytes[i] ?? -1;
  const ascii = (start: number, s: string) => [...s].every((c, i) => b(start + i) === c.charCodeAt(0));
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "jpg";
  if (b(0) === 0x89 && ascii(1, "PNG")) return "png";
  if (ascii(0, "GIF8")) return "gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  if (ascii(0, "%PDF")) return "pdf";
  return null;
}

export const contentTypeFor = (fileName: string): string => {
  const ext = path.extname(fileName).slice(1).toLowerCase();
  return ext === "jpeg" ? MIME.jpg : (MIME[ext as Kind] ?? "application/octet-stream");
};

export class UploadError extends Error {}

export interface StoredFile {
  storedName: string;
  originalName: string;
  size: number;
  mimeType: string;
}

async function store(file: File, dir: string, allowed: Kind[], maxBytes: number, label: string): Promise<StoredFile> {
  if (file.size > maxBytes) throw new UploadError(`« ${file.name} » dépasse ${maxBytes / MB} Mo.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind || !allowed.includes(kind)) throw new UploadError(`« ${file.name} » refusé (${label}).`);
  const storedName = `${Date.now()}-${newId()}.${kind}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, storedName), bytes);
  return { storedName, originalName: file.name.slice(0, 200), size: file.size, mimeType: MIME[kind] };
}

/** Saves an image uploaded from the admin console and returns its public URL. */
export async function saveSiteImage(file: File): Promise<string> {
  const stored = await store(
    file,
    env.paths.siteUploads,
    ["jpg", "png", "webp", "gif"],
    SITE_IMAGE_MAX_BYTES,
    "JPG, PNG, WebP ou GIF, 12 Mo max.",
  );
  return SITE_UPLOAD_PREFIX + stored.storedName;
}

/** Saves a photo or plan attached to a quote request (private, served to the admin only). */
export const saveQuoteFile = (file: File): Promise<StoredFile> =>
  store(
    file,
    env.paths.quoteUploads,
    ["jpg", "png", "webp", "gif", "pdf"],
    QUOTE_FILE_MAX_BYTES,
    "images ou PDF, 10 Mo max.",
  );

/** Resolves a stored file name safely inside its folder (no path traversal). */
export function uploadPath(kind: "site" | "devis", name: string): string | null {
  const base = path.basename(name);
  if (base !== name || base.startsWith(".")) return null;
  return path.join(kind === "site" ? env.paths.siteUploads : env.paths.quoteUploads, base);
}

export async function removeUploads(kind: "site" | "devis", names: string[]): Promise<void> {
  await Promise.all(
    names.map((n) => {
      const p = uploadPath(kind, n);
      return p ? fs.rm(p, { force: true }) : undefined;
    }),
  );
}

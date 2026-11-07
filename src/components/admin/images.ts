"use client";

import { uploadImage } from "@/server/actions/content";
import type { ActionResult } from "@/server/actions/run";

/**
 * Resizes photos in the browser before upload (2000 px max, JPEG 85 %),
 * so phone pictures of several MB stay light on the site.
 */
export async function shrinkImage(file: File, max = 2000): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5e6) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export async function uploadImageFile(file: File): Promise<ActionResult<string>> {
  const form = new FormData();
  form.append("image", await shrinkImage(file));
  return uploadImage(form);
}

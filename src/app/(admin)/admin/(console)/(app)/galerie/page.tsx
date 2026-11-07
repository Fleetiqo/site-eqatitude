import type { Metadata } from "next";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { requireAdmin } from "@/server/auth/session";
import { listGallery } from "@/server/repositories/catalog";

export const metadata: Metadata = { title: "Galerie photos" };

export default async function GalleryPage({ searchParams }: PageProps<"/admin/galerie">) {
  await requireAdmin();
  const { univers } = await searchParams;
  return <GalleryManager photos={listGallery()} universe={univers === "equitation" ? "equitation" : "amenagement"} />;
}

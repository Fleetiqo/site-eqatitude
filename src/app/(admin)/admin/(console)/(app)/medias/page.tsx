import type { Metadata } from "next";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { requireAdmin } from "@/server/auth/session";
import { listMedia, mediaUsages } from "@/server/services/media";

export const metadata: Metadata = { title: "Médiathèque" };

export default async function MediaPage() {
  await requireAdmin();
  const usages = mediaUsages();
  return (
    <MediaLibrary
      media={listMedia().map((m) => ({ url: m.url, uploaded: m.uploaded, usages: usages.get(m.url) ?? [] }))}
    />
  );
}

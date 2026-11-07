import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { COLLECTIONS, isCollectionSlug } from "@/lib/admin-collections";
import { today } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { SERVER_COLLECTIONS } from "@/server/collections";

export async function generateMetadata({ params }: PageProps<"/admin/contenu/[collection]">): Promise<Metadata> {
  const { collection } = await params;
  return { title: isCollectionSlug(collection) ? COLLECTIONS[collection].title : "Rubrique inconnue" };
}

export default async function CollectionPage({ params, searchParams }: PageProps<"/admin/contenu/[collection]">) {
  await requireAdmin();
  const { collection } = await params;
  if (!isCollectionSlug(collection)) notFound();
  const { nouveau } = await searchParams;
  return (
    <CollectionManager
      key={collection}
      slug={collection}
      items={SERVER_COLLECTIONS[collection].list()}
      today={today()}
      openNew={nouveau === "1"}
    />
  );
}

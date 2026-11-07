import type { Metadata } from "next";
import { PageEditor } from "@/components/admin/PageEditor";
import { BLOCK_PAGES, type PageId } from "@/content/blocks";
import { requireAdmin } from "@/server/auth/session";
import { getTexts } from "@/server/repositories/content";

export const metadata: Metadata = { title: "Pages, textes & visuels" };

export default async function PagesPage({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdmin();
  const { page } = await searchParams;
  const current: PageId = typeof page === "string" && Object.hasOwn(BLOCK_PAGES, page) ? (page as PageId) : "home";
  return <PageEditor key={current} page={current} texts={getTexts()} />;
}

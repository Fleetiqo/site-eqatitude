import { NewsBrowser } from "@/components/site/NewsBrowser";
import type { Universe } from "@/lib/types";
import { pageMetadata } from "@/server/queries/metadata";
import { loadNews, loadTexts, trackPageView } from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("nouveautes", "/nouveautes");

export default async function NewsPage({ searchParams }: PageProps<"/nouveautes">) {
  await trackPageView("/nouveautes");
  const { u } = await searchParams;
  const universe: "" | Universe = u === "equitation" || u === "amenagement" ? u : "";
  const t = loadTexts();
  return (
    <main>
      <NewsBrowser
        title={t["nouveautes.title"]}
        items={loadNews()}
        emptyText={t["nouveautes.empty"]}
        initialUniverse={universe}
      />
    </main>
  );
}

import { renderParagraphs } from "@/lib/rich-text";
import { pageMetadata } from "@/server/queries/metadata";
import { loadRichTextContext, loadTexts, trackPageView } from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("legal", "/mentions-legales");

export default async function LegalPage() {
  await trackPageView("/mentions-legales");
  const t = loadTexts();
  const ctx = loadRichTextContext();
  return (
    <main>
      <section className="page-title">
        <div className="wrap">
          <h1>Mentions légales</h1>
        </div>
      </section>
      <section className="block block--tight">
        <div className="wrap prose">
          <h2>Éditeur du site</h2>
          {renderParagraphs(t["legal.publisher"], ctx)}
          <h2>Hébergement</h2>
          {renderParagraphs(t["legal.hosting"], ctx)}
          <h2>Données personnelles</h2>
          {renderParagraphs(t["legal.privacy"], ctx)}
          <h2>Cookies</h2>
          {renderParagraphs(t["legal.cookies"], ctx)}
        </div>
      </section>
    </main>
  );
}

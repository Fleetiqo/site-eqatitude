import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isSafeHref, renderInline, renderParagraphs, toPlainText } from "@/lib/rich-text";

const ctx = { phone: "02 98 53 01 77", phoneIntl: "+33298530177", email: "contact@example.fr" };
const html = (node: React.ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("rich text", () => {
  it("renders bold, italic, line breaks and the phone token", () => {
    expect(html(renderInline("**Gras.** Appelez {telephone}\n*bientôt*", ctx))).toBe(
      '<strong>Gras.</strong> Appelez <a href="tel:+33298530177">02 98 53 01 77</a><br/><em>bientôt</em>',
    );
  });

  it("renders links but refuses dangerous URLs", () => {
    expect(html(renderInline("[devis](/devis)"))).toBe('<a href="/devis">devis</a>');
    expect(html(renderInline("[x](javascript:alert(1))"))).not.toContain("<a");
    expect(isSafeHref("//evil.example")).toBe(false);
    expect(isSafeHref("https://example.fr")).toBe(true);
  });

  it("escapes HTML typed by the user", () => {
    expect(html(renderInline("<script>alert(1)</script>"))).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("splits paragraphs on blank lines", () => {
    expect(html(renderParagraphs("Un\n\nDeux"))).toBe("<p>Un</p><p>Deux</p>");
  });

  it("produces plain text for metadata", () => {
    expect(toPlainText("**Bonjour** [ici](/x) {telephone}", ctx)).toBe("Bonjour ici 02 98 53 01 77");
  });
});

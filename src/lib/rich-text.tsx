import { Fragment, type ReactNode } from "react";

/**
 * Minimal, XSS-safe formatting for texts edited in the admin console.
 *
 *   **gras**            → <strong>
 *   *italique*          → <em>
 *   [libellé](/devis)   → link (relative, https:, mailto: or tel: only)
 *   {telephone} {email} → the shop's phone / e-mail link
 *   line break          → <br>
 *   blank line          → new paragraph (block mode only)
 *
 * Output is built from React elements, never from raw HTML.
 */

export interface RichTextContext {
  phone: string;
  phoneIntl: string;
  email: string;
}

const TOKEN_RE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\)|\{telephone\}|\{email\}|\n)/g;
const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export function isSafeHref(href: string): boolean {
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href);
}

export function renderInline(text: string, ctx?: RichTextContext): ReactNode {
  const parts = text.split(TOKEN_RE).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part === "{telephone}" && ctx)
      return (
        <a key={i} href={`tel:${ctx.phoneIntl}`}>
          {ctx.phone}
        </a>
      );
    if (part === "{email}" && ctx)
      return (
        <a key={i} href={`mailto:${ctx.email}`}>
          {ctx.email}
        </a>
      );
    const link = part.match(LINK_RE);
    if (link && isSafeHref(link[2] ?? "")) {
      const href = link[2] ?? "";
      const external = /^https?:\/\//i.test(href);
      return (
        <a key={i} href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
          {link[1]}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Splits on blank lines and renders one <p> per paragraph. */
export function renderParagraphs(text: string, ctx?: RichTextContext, className?: string): ReactNode {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p, i) => (
      <p key={i} className={className}>
        {renderInline(p.trim(), ctx)}
      </p>
    ));
}

/** Removes formatting marks, for <title>, meta descriptions and alt texts. */
export function toPlainText(text: string, ctx?: RichTextContext): string {
  return text
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\{telephone\}/g, ctx?.phone ?? "")
    .replace(/\{email\}/g, ctx?.email ?? "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

import { NextResponse } from "next/server";
import { CONTACT_FORM_ERROR, contactMessageSchema, isCompleteContactMessage, isEmail } from "@/lib/quotes/validation";
import { jsonError, requestIp } from "@/server/http/request";
import { createMessage } from "@/server/repositories/messages";
import { notifyShop } from "@/server/services/mailer";
import { createRateLimiter } from "@/server/services/rate-limit";

const allow = createRateLimiter(5, 10 * 60 * 1000);

/** Contact form ("Nous écrire"). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactMessageSchema.safeParse(body ?? {});
  if (!parsed.success) return jsonError(CONTACT_FORM_ERROR);
  const { website, ...msg } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // honeypot: pretend success to bots
  if (!isCompleteContactMessage(msg)) return jsonError(CONTACT_FORM_ERROR);
  if (!allow(await requestIp()))
    return jsonError("Trop de messages envoyés. Réessayez dans quelques minutes ou appelez-nous.", 429);

  createMessage(msg);
  await notifyShop(
    `[Site] Message : ${msg.subject || "sans objet"}`,
    `${msg.name}\n${msg.email}\n${msg.phone}\n\n${msg.message}`,
    isEmail(msg.email) ? msg.email : undefined,
  );
  return NextResponse.json({ ok: true });
}

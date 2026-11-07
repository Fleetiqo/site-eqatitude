import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";
import { getSettings } from "../repositories/settings";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const smtp = env.smtp;
  transporter = smtp
    ? nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
      })
    : null;
  return transporter;
}

export const isMailConfigured = (): boolean => env.smtp !== null;

/**
 * Notifies the shop of a new request. Never throws: a mail failure must not
 * lose the request, which is already saved and visible in the console.
 */
export async function notifyShop(subject: string, text: string, replyTo?: string): Promise<void> {
  const t = getTransporter();
  if (!t || !env.smtp) return;
  try {
    await t.sendMail({ from: env.smtp.from, to: env.smtp.to || getSettings().business.email, replyTo, subject, text });
  } catch (error) {
    console.error("[mail] Envoi impossible :", error instanceof Error ? error.message : error);
  }
}

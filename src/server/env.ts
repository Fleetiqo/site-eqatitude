import path from "node:path";
import { z } from "zod";

/**
 * Validated server configuration. Read once; a misconfiguration fails at startup
 * with a clear message instead of at the first e-mail or upload.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** Folder holding the SQLite database and uploaded files. Must be on a persistent disk. */
  DATA_DIR: z.string().default("./storage"),
  /** Public URL of the site, used for the sitemap and absolute links (e.g. https://www.sellerie-equattitud.fr). */
  SITE_URL: z.url().optional().or(z.literal("")),
  /** Initial admin password, used only when no admin account exists yet. */
  ADMIN_PASSWORD: z.string().optional(),
  /** Trust X-Forwarded-For (set to "true" behind nginx, Caddy, Cloudflare…). */
  TRUST_PROXY: z.enum(["true", "false"]).default("false"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  MAIL_TO: z.string().optional(),
});

// Empty values in .env ("SMTP_HOST=") mean "not set".
const definedEnv = Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== ""));
const parsed = schema.safeParse(definedEnv);
if (!parsed.success) {
  throw new Error(`Configuration invalide (.env) :\n${z.prettifyError(parsed.error)}`);
}

const raw = parsed.data;
const dataDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), raw.DATA_DIR);

export const env = {
  isProduction: raw.NODE_ENV === "production",
  siteUrl: raw.SITE_URL ? raw.SITE_URL.replace(/\/$/, "") : "",
  adminPassword: raw.ADMIN_PASSWORD || undefined,
  trustProxy: raw.TRUST_PROXY === "true",
  paths: {
    data: dataDir,
    database: path.join(dataDir, "equattitud.db"),
    siteUploads: path.join(dataDir, "uploads", "site"),
    quoteUploads: path.join(dataDir, "uploads", "devis"),
    backups: path.join(dataDir, "backups"),
  },
  smtp: raw.SMTP_HOST
    ? {
        host: raw.SMTP_HOST,
        port: raw.SMTP_PORT,
        user: raw.SMTP_USER,
        pass: raw.SMTP_PASS,
        from: raw.MAIL_FROM || raw.SMTP_USER || "",
        to: raw.MAIL_TO,
      }
    : null,
};

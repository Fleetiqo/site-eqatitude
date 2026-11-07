import { env } from "./env";
import { generatePassword, hashPassword } from "./auth/password";
import { getPasswordHash, setPasswordHash } from "./repositories/auth";
import { importContent, isEmptyDatabase, type SiteContent } from "./services/content-transfer";
import defaultContent from "./db/default-content.json";

/**
 * First start: fills an empty database with the default site content and creates the
 * admin account. Safe to run on every start (does nothing once initialised).
 */
export async function bootstrap(): Promise<void> {
  if (isEmptyDatabase()) {
    importContent(defaultContent as SiteContent);
    console.log("[init] Base de données créée avec le contenu par défaut.");
  }
  if (!getPasswordHash()) {
    const password = env.adminPassword ?? generatePassword();
    setPasswordHash(await hashPassword(password));
    if (env.adminPassword) console.log("[init] Compte admin créé avec ADMIN_PASSWORD.");
    else
      console.log(`\n  Mot de passe admin généré : ${password}\n  (modifiable dans la console, rubrique « Compte »)\n`);
  }
}

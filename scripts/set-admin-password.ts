/**
 * Resets the admin password (e.g. when it is lost):
 *   npm run admin:password -- "nouveau-mot-de-passe"
 * All open sessions are closed.
 */
import "./_env";
import { hashPassword, MIN_PASSWORD_LENGTH } from "@/server/auth/password";
import { deleteAllSessions, setPasswordHash } from "@/server/repositories/auth";

const password = process.argv[2] ?? "";
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Usage : npm run admin:password -- "mot-de-passe" (${MIN_PASSWORD_LENGTH} caractères minimum)`);
  process.exit(1);
}
setPasswordHash(await hashPassword(password));
deleteAllSessions();
console.log("Mot de passe administrateur modifié.");

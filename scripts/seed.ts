/** Creates the database with the default content and the admin account (no-op if already initialised). */
import "./_env";
import { bootstrap } from "@/server/bootstrap";

await bootstrap();
console.log("Base prête.");

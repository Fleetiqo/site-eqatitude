import { randomBytes } from "node:crypto";

/** Short random identifier (12 hex characters, same format as the original site). */
export const newId = (): string => randomBytes(6).toString("hex");

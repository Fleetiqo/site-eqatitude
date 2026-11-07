import { createHash, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { getDb } from "../db/client";
import { adminAccount, loginAttempts, sessions } from "../db/schema";

// --- Admin account ------------------------------------------------------------

export const getPasswordHash = (): string | undefined =>
  getDb().select({ hash: adminAccount.passwordHash }).from(adminAccount).where(eq(adminAccount.id, 1)).get()?.hash;

export function setPasswordHash(passwordHash: string): void {
  const updatedAt = new Date().toISOString();
  getDb()
    .insert(adminAccount)
    .values({ id: 1, passwordHash, updatedAt })
    .onConflictDoUpdate({ target: adminAccount.id, set: { passwordHash, updatedAt } })
    .run();
}

// --- Sessions -----------------------------------------------------------------

/** Idle timeout: a session expires after 12 hours without activity. */
export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000;

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session and returns the token to put in the cookie (only its hash is stored). */
export function createSession(now = Date.now()): string {
  const token = randomBytes(32).toString("base64url");
  const db = getDb();
  db.delete(sessions).where(lt(sessions.expiresAt, now)).run();
  db.insert(sessions)
    .values({ id: digest(token), expiresAt: now + SESSION_IDLE_MS })
    .run();
  return token;
}

/** Validates a token and slides its expiry. */
export function touchSession(token: string, now = Date.now()): boolean {
  const db = getDb();
  const id = digest(token);
  const row = db.select().from(sessions).where(eq(sessions.id, id)).get();
  if (!row || row.expiresAt < now) return false;
  // Only write when meaningful, to keep page loads read-only most of the time.
  if (row.expiresAt - now < SESSION_IDLE_MS - 60_000) {
    db.update(sessions)
      .set({ expiresAt: now + SESSION_IDLE_MS })
      .where(eq(sessions.id, id))
      .run();
  }
  return true;
}

export const deleteSession = (token: string): void =>
  void getDb()
    .delete(sessions)
    .where(eq(sessions.id, digest(token)))
    .run();

/** Logs out every device, e.g. after a password change. */
export const deleteAllSessions = (): void => void getDb().delete(sessions).run();

// --- Brute-force protection ---------------------------------------------------

const MAX_FAILURES = 5;
const LOCK_MS = 10 * 60 * 1000;

export function isLocked(key: string, now = Date.now()): boolean {
  const row = getDb().select().from(loginAttempts).where(eq(loginAttempts.key, key)).get();
  return !!row && row.lockedUntil > now;
}

export function recordFailure(key: string, now = Date.now()): void {
  const db = getDb();
  const row = db.select().from(loginAttempts).where(eq(loginAttempts.key, key)).get();
  const failures = (row?.failures ?? 0) + 1;
  const value =
    failures >= MAX_FAILURES
      ? { failures: 0, lockedUntil: now + LOCK_MS }
      : { failures, lockedUntil: row?.lockedUntil ?? 0 };
  db.insert(loginAttempts)
    .values({ key, ...value })
    .onConflictDoUpdate({ target: loginAttempts.key, set: value })
    .run();
}

export const clearFailures = (key: string): void =>
  void getDb().delete(loginAttempts).where(eq(loginAttempts.key, key)).run();

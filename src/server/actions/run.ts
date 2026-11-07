import { refresh } from "next/cache";
import { ZodError } from "zod";
import { requireAdmin } from "../auth/session";
import { UploadError } from "../services/storage";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

/** An error whose message is meant for the user. */
export class UserError extends Error {}

/**
 * Wraps every admin mutation: checks the session, runs the change, refreshes the
 * current page's data and turns expected errors into a message for the console.
 * Unexpected errors are rethrown (logged by Next.js, generic message to the user).
 */
export async function adminAction<T>(fn: () => T | Promise<T>): Promise<ActionResult<T>> {
  await requireAdmin();
  try {
    const data = await fn();
    refresh();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, error: error.issues[0]?.message ?? "Données invalides." };
    if (error instanceof UserError || error instanceof UploadError) return { ok: false, error: error.message };
    throw error;
  }
}

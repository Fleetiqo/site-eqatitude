import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";
import { createSession, deleteSession, touchSession } from "../repositories/auth";

const COOKIE = "eq_admin";
/** The cookie outlives the session; the database decides (12 h idle timeout). */
const COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60;

/** True when the request carries a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE)?.value;
  return !!token && touchSession(token);
}

/**
 * Guard for every admin page, server action and route handler.
 * Layout checks alone are not enough in the App Router, so each entry point calls this.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/connexion");
}

export async function startSession(): Promise<void> {
  const token = createSession();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.isProduction,
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) deleteSession(token);
  store.delete(COOKIE);
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, startSession } from "../auth/session";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "../auth/password";
import { requestIp } from "../http/request";
import { logActivity } from "../repositories/activity";
import {
  clearFailures,
  deleteAllSessions,
  getPasswordHash,
  isLocked,
  recordFailure,
  setPasswordHash,
} from "../repositories/auth";
import { adminAction, UserError, type ActionResult } from "./run";

export async function login(password: string): Promise<ActionResult> {
  const key = `login:${await requestIp()}`;
  if (isLocked(key)) return { ok: false, error: "Trop de tentatives, réessayez dans quelques minutes." };
  const hash = getPasswordHash();
  if (!hash || !(await verifyPassword(String(password ?? ""), hash))) {
    recordFailure(key);
    return { ok: false, error: "Mot de passe incorrect." };
  }
  clearFailures(key);
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/connexion");
}

const passwordSchema = z
  .object({
    current: z.string(),
    next: z.string().min(MIN_PASSWORD_LENGTH, `${MIN_PASSWORD_LENGTH} caractères minimum.`),
    confirm: z.string(),
  })
  .refine((p) => p.next === p.confirm, "Les deux mots de passe ne correspondent pas.");

/** Changes the password and signs out every other device. */
export async function changePassword(input: z.input<typeof passwordSchema>) {
  return adminAction(async () => {
    const p = passwordSchema.parse(input);
    const hash = getPasswordHash();
    if (!hash || !(await verifyPassword(p.current, hash))) throw new UserError("Mot de passe actuel incorrect.");
    setPasswordHash(await hashPassword(p.next));
    deleteAllSessions();
    await startSession();
    logActivity("Changement du mot de passe");
    return null;
  });
}

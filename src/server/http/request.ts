import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "../env";

/** Best-effort client IP for rate limiting (only trusted behind a configured proxy). */
export async function requestIp(): Promise<string> {
  if (!env.trustProxy) return "direct";
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export const jsonError = (error: string, status = 400) => NextResponse.json({ error }, { status });

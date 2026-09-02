import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { getAuthEnv } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "tool_factory_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 12;

type SessionPayload = { version: 1; expiresAt: number; nonce: string };

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(
  secret: string,
  now = Date.now(),
  nonce = randomBytes(16).toString("base64url"),
): string {
  const payload: SessionPayload = {
    version: 1,
    expiresAt: Math.floor(now / 1000) + ADMIN_SESSION_DURATION_SECONDS,
    nonce,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

export function verifyAdminSessionToken(token: string, secret: string, now = Date.now()): boolean {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return false;
  const expected = sign(encoded, secret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<SessionPayload>;
    return payload.version === 1 &&
      typeof payload.expiresAt === "number" &&
      payload.expiresAt > Math.floor(now / 1000) &&
      typeof payload.nonce === "string" && payload.nonce.length >= 16;
  } catch {
    return false;
  }
}

export const getAdminUser = cache(async () => {
  const env = getAuthEnv();
  if (!env.success) return null;
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !verifyAdminSessionToken(token, env.data.SESSION_SECRET)) return null;
  return { id: "admin" as const };
});

export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("管理者権限が必要です。");
  return admin;
}

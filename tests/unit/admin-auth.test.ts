import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifyAdminPassword } from "@/lib/auth/password";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/auth/session";

describe("admin password authentication", () => {
  it("accepts the correct password and rejects an incorrect one", async () => {
    const passwordHash = await hash("correct-password", 4);
    await expect(verifyAdminPassword("correct-password", passwordHash)).resolves.toBe(true);
    await expect(verifyAdminPassword("wrong-password", passwordHash)).resolves.toBe(false);
  });
});

describe("signed admin session", () => {
  const secret = "a-secure-session-secret-with-at-least-32-bytes";
  const now = Date.UTC(2026, 8, 2);

  it("accepts a valid signed session", () => {
    const token = createAdminSessionToken(secret, now, "fixed-nonce-for-testing");
    expect(verifyAdminSessionToken(token, secret, now + 1000)).toBe(true);
  });

  it("rejects forged, wrong-secret and expired sessions", () => {
    const token = createAdminSessionToken(secret, now, "fixed-nonce-for-testing");
    expect(verifyAdminSessionToken(`${token}x`, secret, now)).toBe(false);
    expect(verifyAdminSessionToken(token, `${secret}-wrong`, now)).toBe(false);
    expect(verifyAdminSessionToken(token, secret, now + 13 * 60 * 60 * 1000)).toBe(false);
  });
});

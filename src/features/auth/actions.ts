"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_DURATION_SECONDS, createAdminSessionToken } from "@/lib/auth/session";
import { verifyAdminPassword } from "@/lib/auth/password";
import { getAuthEnv } from "@/lib/env";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const env = getAuthEnv();
  if (!env.success) redirect("/admin/login?error=config");
  const valid = await verifyAdminPassword(password, env.data.ADMIN_PASSWORD_HASH);
  if (!valid) redirect("/admin/login?error=invalid");
  (await cookies()).set(ADMIN_SESSION_COOKIE, createAdminSessionToken(env.data.SESSION_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  redirect("/admin/login");
}

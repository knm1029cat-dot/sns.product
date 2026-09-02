import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const authEnvSchema = z.object({
  ADMIN_PASSWORD_HASH: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
});

export function getDatabaseEnv() {
  return databaseEnvSchema.safeParse({ DATABASE_URL: process.env.DATABASE_URL });
}

export function getAuthEnv() {
  return authEnvSchema.safeParse({
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseEnv().success;
}

export function isAdminAuthConfigured(): boolean {
  return getAuthEnv().success;
}

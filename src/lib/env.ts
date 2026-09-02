import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const authEnvSchema = z.object({
  ADMIN_PASSWORD_HASH: z.string().min(20),
  SESSION_SECRET: z.string().min(32),
});

const aiEnvSchema = z.object({
  AI_PROVIDER_ENDPOINT: z.url(),
  AI_API_KEY: z.string().min(1),
  AI_MODEL: z.string().min(1),
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

export function getAiEnv() {
  return aiEnvSchema.safeParse({ AI_PROVIDER_ENDPOINT: process.env.AI_PROVIDER_ENDPOINT, AI_API_KEY: process.env.AI_API_KEY, AI_MODEL: process.env.AI_MODEL });
}

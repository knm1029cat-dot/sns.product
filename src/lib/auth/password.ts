import { compare } from "bcryptjs";

export function verifyAdminPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

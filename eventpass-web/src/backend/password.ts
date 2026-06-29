import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  if (passwordHash.startsWith("$argon2")) {
    return verify(passwordHash, password);
  }
  // Legacy accounts created before the switch to argon2.
  return bcrypt.compare(password, passwordHash);
}

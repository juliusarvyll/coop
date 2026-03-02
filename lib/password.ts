import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "s1";
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("base64url");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("base64url");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [prefix, salt, expectedHash] = storedHash.split("$");
  if (!prefix || !salt || !expectedHash || prefix !== HASH_PREFIX) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, "base64url");
  const actualBuffer = scryptSync(password, salt, expectedBuffer.length);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

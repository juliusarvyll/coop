import { createHmac, timingSafeEqual } from "node:crypto";

type Role = "admin" | "voter";

type SessionPayload = {
  role: Role;
  voterId?: number;
  iat: number;
  exp: number;
};

export const ADMIN_COOKIE_NAME = "coop_admin_session";
export const VOTER_COOKIE_NAME = "coop_voter_session";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set and at least 16 characters.");
  }

  return "dev-only-change-session-secret";
}

function toBase64Url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(payload: SessionPayload): string {
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function decodeSession(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = sign(encoded);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as SessionPayload;
    if (!parsed.role || typeof parsed.exp !== "number" || typeof parsed.iat !== "number") {
      return null;
    }

    if (Date.now() >= parsed.exp * 1000) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function createSession(role: Role, expiresInSeconds: number, voterId?: number): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    role,
    voterId,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  return encodeSession(payload);
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 8,
};

export const voterCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 2,
};

export function createAdminSessionToken(): string {
  return createSession("admin", adminCookieOptions.maxAge);
}

export function createVoterSessionToken(voterId: number): string {
  return createSession("voter", voterCookieOptions.maxAge, voterId);
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const payload = decodeSession(token);
  return payload?.role === "admin";
}

export function verifyVoterSessionToken(token: string | undefined): number | null {
  if (!token) {
    return null;
  }

  const payload = decodeSession(token);
  if (payload?.role !== "voter" || typeof payload.voterId !== "number") {
    return null;
  }

  return payload.voterId;
}

import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  ACCESS_TOKEN_COOKIE,
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  SESSION_DAYS,
  type SessionPayload,
} from "@/lib/auth/crypto";
import { MOCK_ORG_ID, MOCK_SESSION_ID, MOCK_USER_ID } from "@/lib/config";

export {
  ACCESS_TOKEN_COOKIE,
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  type SessionPayload,
} from "@/lib/auth/crypto";

/** No-op password helpers kept for Laravel parity (mock mode only). */
export async function hashPassword(password: string): Promise<string> {
  return `mock$${password}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (hash.startsWith("mock$")) {
    return hash.slice(5) === password;
  }
  return password.length >= 8;
}

function cookieOptions(expiresAt: Date) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresAt,
    path: "/",
  };
}

/**
 * Creates a signed session JWT cookie + optional Sanctum bearer cookie.
 * The bearer is never embedded in the JWT (limits blast radius of SESSION_SECRET).
 */
export async function createSession(
  userId: string = MOCK_USER_ID,
  organizationId: string = MOCK_ORG_ID,
  accessToken?: string,
  role?: "owner" | "admin" | "member",
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const jwt = await encryptSession({
    sessionId: MOCK_SESSION_ID,
    userId,
    organizationId,
    role,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  const opts = cookieOptions(expiresAt);
  cookieStore.set(SESSION_COOKIE, jwt, opts);

  if (accessToken) {
    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, opts);
  } else {
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

export async function readSessionCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const payload = await decryptSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  return {
    ...payload,
    ...(accessToken ? { accessToken } : {}),
  };
}

export function slugifyOrgName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}

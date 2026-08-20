import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "invomind_session";
/** Sanctum bearer — separate HttpOnly cookie (never embedded in the session JWT). */
export const ACCESS_TOKEN_COOKIE = "invomind_access";
export const SESSION_DAYS = 7;

export type SessionPayload = {
  sessionId: string;
  userId: string;
  organizationId: string;
  role?: "owner" | "admin" | "member";
  /** Populated at read time from ACCESS_TOKEN_COOKIE — never signed into the JWT. */
  accessToken?: string;
  expiresAt: string;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  const minLen = process.env.NODE_ENV === "production" ? 32 : 16;
  if (!secret || secret.length < minLen) {
    throw new Error(
      `SESSION_SECRET must be set (min ${minLen} characters${
        process.env.NODE_ENV === "production" ? " in production" : ""
      })`,
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    secret.includes("dev-session-secret")
  ) {
    throw new Error(
      "SESSION_SECRET must not use the example/dev value in production",
    );
  }
  return new TextEncoder().encode(secret);
}

/** JWT claims only — never put the Sanctum bearer here. */
type SessionJwtClaims = Omit<SessionPayload, "accessToken">;

export async function encryptSession(
  payload: SessionJwtClaims,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionJwtClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    const claims = payload as unknown as SessionJwtClaims & {
      accessToken?: string;
    };
    // Strip any legacy accessToken claim from older cookies.
    const { accessToken: _legacy, ...safe } = claims;
    void _legacy;
    return safe;
  } catch {
    return null;
  }
}

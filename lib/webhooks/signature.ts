import { createHmac, timingSafeEqual } from "node:crypto";

/** Sign `${timestamp}.${rawBody}` with HMAC-SHA256. Returns `sha256=<hex>`. */
export function signPayload(
  secret: string,
  timestamp: string,
  rawBody: string,
): string {
  const digest = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `sha256=${digest}`;
}

/**
 * Verify Meta's `X-Hub-Signature-256` header against the raw request body.
 * Lengths are equalized before timingSafeEqual to avoid throwing.
 */
export function verifyMetaSignature(
  appSecret: string,
  rawBody: string,
  header: string | null,
): boolean {
  if (!header || !appSecret) return false;
  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify TikTok's `TikTok-Signature: t=<unix>,s=<hex>` header.
 * HMAC-SHA256 over `${t}.${rawBody}` keyed with the client secret.
 * Rejects timestamps older/newer than `toleranceSeconds` (replay protection).
 */
export function verifyTikTokSignature(
  clientSecret: string,
  rawBody: string,
  header: string | null,
  toleranceSeconds = 300,
): boolean {
  if (!header || !clientSecret) return false;

  let timestamp = "";
  let signature = "";
  for (const part of header.split(",")) {
    const [key, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (key === "t") timestamp = value;
    if (key === "s") signature = value;
  }
  if (!timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const expected = createHmac("sha256", clientSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

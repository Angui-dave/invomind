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

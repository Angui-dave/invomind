/**
 * Allowlist for outbound payment / billing redirects (open-redirect defense).
 */

const ALLOWED_CHECKOUT_HOSTS = [
  "checkout.cinetpay.com",
  "api-checkout.cinetpay.com",
  "secure.cinetpay.com",
  "checkout.cinetpay.test",
];

function hostAllowed(hostname: string, allowed: string): boolean {
  const host = hostname.toLowerCase();
  const needle = allowed.toLowerCase();
  return host === needle || host.endsWith(`.${needle}`);
}

export function isAllowedCheckoutUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_CHECKOUT_HOSTS.some((h) => hostAllowed(parsed.hostname, h));
  } catch {
    return false;
  }
}

export function assertAllowedCheckoutUrl(url: string): string | null {
  return isAllowedCheckoutUrl(url) ? url : null;
}

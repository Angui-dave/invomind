import "server-only";
import {
  clientIpFromRequest,
  consumeRateLimit,
} from "@/lib/security/rate-limit";

/**
 * Forward inbound provider webhooks to Laravel (source of truth).
 * Preserves method, query string, raw body, and relevant signature headers.
 */
export async function proxyWebhookToLaravel(
  request: Request,
  laravelPath: string,
): Promise<Response> {
  const ip = clientIpFromRequest(request);
  const limited = consumeRateLimit(`webhook-proxy:${ip}`, 60, 60_000);
  if (!limited.ok) {
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(limited.retryAfterSec) },
    });
  }

  const base = process.env.LARAVEL_API_URL?.replace(/\/+$/, "");
  if (!base) {
    return new Response("LARAVEL_API_URL non configuré", { status: 503 });
  }

  const incoming = new URL(request.url);
  const target = new URL(`${base}${laravelPath.startsWith("/") ? laravelPath : `/${laravelPath}`}`);
  target.search = incoming.search;

  const headers = new Headers();
  const forwardHeaders = [
    "content-type",
    "x-hub-signature-256",
    "tiktok-signature",
    "x-token",
    "user-agent",
  ];
  for (const name of forwardHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);

  return new Response(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

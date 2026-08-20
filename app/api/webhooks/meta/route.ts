import { proxyWebhookToLaravel } from "@/lib/webhooks/proxy-laravel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta verify challenge — proxied to Laravel. */
export async function GET(request: Request) {
  return proxyWebhookToLaravel(request, "/webhooks/meta");
}

/** Inbound Meta events — processed by Laravel (not the Next mock store). */
export async function POST(request: Request) {
  return proxyWebhookToLaravel(request, "/webhooks/meta");
}

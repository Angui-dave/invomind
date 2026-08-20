import { proxyWebhookToLaravel } from "@/lib/webhooks/proxy-laravel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Inbound TikTok events — processed by Laravel. */
export async function POST(request: Request) {
  return proxyWebhookToLaravel(request, "/webhooks/tiktok");
}

import { readSessionCookie } from "@/lib/auth/session";
import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { laravelRequest } from "@/lib/laravel/client";
import { mapInboundMessage } from "@/lib/laravel/mappers";
import { inboundSince } from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await verifySession();
  const token = (await readSessionCookie())?.accessToken;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  if (isLaravelApiEnabled()) {
    const qs = since
      ? `/conversations/inbox?since=${encodeURIComponent(since)}`
      : "/conversations/inbox";
    const payload = await laravelRequest<{ messages: unknown[] }>(qs, {
      token,
      organizationId: session.organizationId,
    });
    const messages = Array.isArray(payload.messages)
      ? payload.messages.map(mapInboundMessage)
      : [];
    return Response.json({ messages });
  }
  const messages = await inboundSince(session.organizationId, since);
  return Response.json({ messages });
}

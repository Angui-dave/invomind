import { isLaravelApiEnabled } from "@/lib/config";
import { verifySession } from "@/lib/dal/session";
import { inboundSince } from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mock-mode inbound poll. In Laravel mode use Reverb +
 * `refreshConversationsSnapshot` server action.
 */
export async function GET(request: Request) {
  if (isLaravelApiEnabled()) {
    return Response.json(
      {
        error:
          "Polling inbox legacy indisponible. Utilisez Reverb ou refreshConversationsSnapshot.",
      },
      { status: 501 },
    );
  }
  const session = await verifySession();
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const messages = await inboundSince(session.organizationId, since);
  return Response.json({ messages });
}

import { verifySession } from "@/lib/dal/session";
import { inboundSince } from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await verifySession();
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const messages = await inboundSince(session.organizationId, since);
  return Response.json({ messages });
}

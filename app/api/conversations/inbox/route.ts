import { inboundSince } from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const messages = inboundSince(since);
  return Response.json({ messages });
}

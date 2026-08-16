import {
  getMaskedConfig,
  recentDeliveries,
  setConfig,
} from "@/lib/webhooks/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidWebhookUrl(url: string): boolean {
  if (!url) return true; // empty allowed when disabling
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === "https:") return true;
  if (
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
  ) {
    return true;
  }
  return false;
}

export async function GET() {
  return Response.json({
    config: getMaskedConfig(),
    deliveries: recentDeliveries(),
  });
}

export async function PUT(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return Response.json({ error: "Corps invalide" }, { status: 400 });
  }

  const body = json as Record<string, unknown>;
  const url = typeof body.url === "string" ? body.url.trim() : undefined;
  const secret =
    typeof body.secret === "string" ? body.secret : undefined;
  const enabled =
    typeof body.enabled === "boolean" ? body.enabled : undefined;

  if (url !== undefined && !isValidWebhookUrl(url)) {
    return Response.json(
      {
        error:
          "URL invalide : HTTPS requis (HTTP autorisé uniquement pour localhost)",
      },
      { status: 400 },
    );
  }

  const next = setConfig({
    ...(url !== undefined ? { url } : {}),
    ...(secret !== undefined ? { secret } : {}),
    ...(enabled !== undefined ? { enabled } : {}),
  });

  // If URL cleared, force disabled
  if (next.url === "" && next.enabled) {
    setConfig({ enabled: false });
  }

  return Response.json({
    config: getMaskedConfig(),
    deliveries: recentDeliveries(),
  });
}

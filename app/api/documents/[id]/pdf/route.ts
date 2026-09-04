import { isLaravelApiEnabled } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dashboard PDF proxy. Laravel no longer exposes GET /documents/{id}/pdf
 * (quotes/invoices PDF not wired yet).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await params;
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { message: "Le PDF n’est pas disponible en mode mock." },
      { status: 409 },
    );
  }

  return Response.json(
    { message: "Le PDF sera bientôt disponible." },
    { status: 501 },
  );
}

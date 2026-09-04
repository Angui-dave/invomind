import { isLaravelApiEnabled } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  await params;
  if (!isLaravelApiEnabled()) {
    return Response.json(
      { message: "Le reçu n’est pas disponible en mode mock." },
      { status: 409 },
    );
  }

  return Response.json(
    { message: "Le reçu PDF sera bientôt disponible." },
    { status: 501 },
  );
}
